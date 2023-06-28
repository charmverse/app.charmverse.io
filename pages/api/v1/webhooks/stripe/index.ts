import { InsecureOperationError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { StripeSubscription, SubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';

import { getLoopProducts } from 'lib/loop/loop';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { defaultHandler } from 'lib/public-api/handler';
import { communityProduct, loopCheckoutUrl } from 'lib/subscription/constants';
import { stripeClient } from 'lib/subscription/stripe';
import { relay } from 'lib/websockets/relay';

// Stripe requires the raw body to construct the event. https://vercel.com/guides/getting-started-with-nextjs-typescript-stripe
export const config = { api: { bodyParser: false } };

function buffer(req: NextApiRequest) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', reject);
  });
}

const handler = defaultHandler();

handler.post(stripePayment);

/**
 * @swagger
 * /stripe:
 *   post:
 *     summary: Create/Update a Stripe subscription from an event.
 *     description: We will receive an event and depending on type we will update the db.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *               oneOf:
 *                  - type: object
 *                    properties:
 *                       [key: string]:
 *                          type: string
 *                  - type: string
 *     responses:
 *       200:
 *         description: Update succeeded
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Subcsription'
 */

export async function stripePayment(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!webhookSecret) {
    throw new InsecureOperationError('Stripe webhook secret not found');
  }

  if (!signature) {
    throw new InsecureOperationError('Signature not found');
  }

  try {
    const body = await buffer(req);
    const event: Stripe.Event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const stripeSubscription = await stripeClient.subscriptions.retrieve(subscriptionId);
        let paidTier = stripeSubscription.metadata.tier as SubscriptionTier;
        const spaceId = stripeSubscription.metadata.spaceId;
        const subscriptionData: Stripe.InvoiceLineItem | undefined = invoice.lines.data[0];
        const productId = subscriptionData?.price?.product as string | undefined;

        if (productId && productId !== communityProduct.id) {
          const product = await stripeClient.products.retrieve(productId);
          if (product?.name && product.name.toLowerCase().match('enterprise')) {
            paidTier = 'enterprise';
          }
        }

        const customerId = invoice.customer as string;
        const priceInterval = subscriptionData?.price?.recurring?.interval;

        if (!spaceId) {
          log.warn(
            `Can't create the user subscription. SpaceId was not defined in the metadata for subscription ${stripeSubscription.id}`
          );
          break;
        }

        const space = await prisma.space.findUnique({
          where: { id: spaceId, deletedAt: null }
        });

        if (!space) {
          log.warn(`Can't update the user subscription. Space not found for subscription ${stripeSubscription.id}`);
          break;
        }

        if (!subscriptionData || !subscriptionData.price || !productId || !spaceId || !priceInterval) {
          log.warn(`Can't update the user subscription. Subscription with id ${stripeSubscription.id} has no data`);
          break;
        }

        const period = priceInterval === 'month' ? ('monthly' as const) : ('annual' as const);

        const newData: Omit<StripeSubscription, 'id' | 'createdAt' | 'spaceId'> = {
          customerId,
          subscriptionId,
          deletedAt: null
        };

        await prisma.$transaction([
          prisma.stripeSubscription.upsert({
            where: {
              subscriptionId: stripeSubscription.id,
              spaceId
            },
            create: {
              ...newData,
              spaceId
            },
            update: {}
          }),
          prisma.space.update({
            where: {
              id: space.id
            },
            data: {
              paidTier: paidTier === 'enterprise' ? 'enterprise' : 'pro'
            }
          })
        ]);

        if (invoice.billing_reason === 'subscription_create' && invoice.payment_intent) {
          // The subscription automatically activates after successful payment
          // Set the payment method used to pay the first invoice
          // as the default payment method for that subscription

          const paymentIntent = await stripeClient.paymentIntents.retrieve(invoice.payment_intent as string, {
            expand: ['latest_invoice']
          });

          if (typeof paymentIntent.payment_method === 'string') {
            await stripeClient.subscriptions.update(invoice.subscription as string, {
              default_payment_method: paymentIntent.payment_method
            });
          }
          // Make sure we're not triggering any actions for free trials
          if (invoice.total > 0) {
            const otherSubscriptions = await stripeClient.subscriptions
              .list({
                customer: customerId
              })
              // Cancel any subscriptions with an invoice value of 0 - This should cover the free trial case
              .then((data) => data.data.filter((sub) => sub.id !== invoice.subscription).map((sub) => sub.id));

            for (const sub of otherSubscriptions) {
              await stripeClient.subscriptions.del(sub);
            }

            await prisma.stripeSubscription.updateMany({
              where: {
                subscriptionId: {
                  in: otherSubscriptions
                }
              },
              data: {
                deletedAt: new Date()
              }
            });
          }
        }

        log.info(
          `The invoice number ${invoice.id} for the subscription ${stripeSubscription.id} was paid for the spaceId ${spaceId}`
        );

        trackUserAction('checkout_subscription', {
          userId: space.updatedBy,
          spaceId,
          productId,
          period,
          tier: stripeSubscription.metadata.tier as SubscriptionTier,
          result: 'success'
        });

        relay.broadcast(
          {
            type: 'space_subscription',
            payload: {
              type: 'activated',
              paidTier
            }
          },
          spaceId
        );

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const spaceId = subscription.metadata.spaceId as string;
        const spaceSubscription = await prisma.stripeSubscription.findUnique({
          where: {
            spaceId,
            subscriptionId: subscription.id,
            deletedAt: null
          },
          include: {
            space: {
              select: {
                id: true,
                paidTier: true
              }
            }
          }
        });

        if (!spaceSubscription) {
          log.warn(`Can't update the space subscription. Space subscription not found with id ${subscription.id}`);
          break;
        }

        let space = spaceSubscription.space;

        if (subscription.status === 'canceled') {
          await prisma.stripeSubscription.update({
            where: {
              id: subscription.id
            },
            data: {
              deletedAt: new Date()
            }
          });

          if (space.paidTier !== 'free' && space.paidTier !== 'enterprise') {
            space = await prisma.space.update({
              where: {
                id: space.id
              },
              data: {
                paidTier: 'cancelled'
              }
            });
          }
        }

        relay.broadcast(
          {
            type: 'space_subscription',
            payload: {
              type: 'updated',
              paidTier: space.paidTier as SubscriptionTier
            }
          },
          spaceId
        );

        break;
      }

      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;

        if (!subscriptionId) {
          log.warn(`The invoice ${invoice.id} does not have a subscription attached to it`);
          break;
        }

        const stripeSubscription = await stripeClient.subscriptions.retrieve(subscriptionId, {
          expand: ['customer']
        });

        const spaceId = stripeSubscription.metadata.spaceId;
        const subscriptionData: Stripe.InvoiceLineItem | undefined = invoice.lines.data[0];
        const priceId = subscriptionData?.price?.id;
        const email = (stripeSubscription.customer as Stripe.Customer)?.email as string | undefined | null;

        if (!stripeSubscription.metadata.loopCheckout && priceId) {
          const loopItems = await getLoopProducts();
          const loopItem = loopItems.find((product) => product.externalId === priceId);

          if (!loopItem) {
            log.warn(
              `Loop item was not found in order to create a loop url checkout in stripe for the price ${priceId} and space ${spaceId}`
            );
            break;
          }

          const loopUrl = loopItem.url
            ? `${loopItem.url}?cartEnabled=false&email=${email}&sub=${subscriptionId}`
            : `${loopCheckoutUrl}/${loopItem.entityId}/${loopItem.itemId}?&cartEnabled=false&email=${email}&sub=${subscriptionId}`;

          await stripeClient.subscriptions.update(subscriptionId, {
            metadata: {
              ...(stripeSubscription.metadata || {}),
              loopCheckout: loopUrl
            }
          });

          log.info(`Loop checkout url was succesfully added in stripe metadata for the space ${spaceId}`);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const spaceId = subscription.metadata.spaceId as string;
        const spaceSubscription = await prisma.stripeSubscription.findUnique({
          where: {
            subscriptionId: subscription.id
          },
          select: {
            id: true,
            deletedAt: true
          }
        });

        if (!spaceSubscription) {
          log.warn(
            `Can't update the user subscription. Space subscription not found for subscription ${subscription.id}`
          );
          break;
        }

        const afterUpdate = await prisma.stripeSubscription.update({
          where: {
            spaceId,
            subscriptionId: subscription.id
          },
          data: {
            deletedAt: new Date()
          },
          select: {
            space: {
              select: {
                paidTier: true
              }
            }
          }
        });

        if (afterUpdate.space.paidTier !== 'free' && afterUpdate.space.paidTier !== 'enterprise') {
          await prisma.space.update({
            where: {
              id: spaceId
            },
            data: {
              paidTier: 'cancelled'
            }
          });
        }

        relay.broadcast(
          {
            type: 'space_subscription',
            payload: {
              type: 'cancelled',
              paidTier: 'cancelled'
            }
          },
          spaceId
        );

        break;
      }
      default: {
        log.debug(`Unhandled event type in stripe webhook: ${event.type}`);
        break;
      }
    }

    res.status(200).end();
  } catch (err: any) {
    log.warn('Stripe webhook failed to construct event', err);
    res.status(400).json(`Webhook Error: ${err?.message}`);
  }
}

export default handler;
