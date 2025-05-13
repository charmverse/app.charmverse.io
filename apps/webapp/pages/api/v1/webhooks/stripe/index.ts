import { InsecureOperationError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { StripeSubscription, SubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getLoopProducts } from '@packages/lib/loop/loop';
import { communityProduct, loopCheckoutUrl } from '@packages/lib/subscription/constants';
import { getActiveSpaceSubscription } from '@packages/lib/subscription/getActiveSpaceSubscription';
import { stripeClient } from '@packages/lib/subscription/stripe';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';

import { defaultHandler } from 'lib/public-api/handler';

// Stripe requires the raw body to construct the event.https://vercel.com/guides/getting-started-with-nextjs-typescript-stripe
export const config = { api: { bodyParser: false } };

function buffer(req: NextApiRequest) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks as any));
    });

    req.on('error', reject);
  });
}

const handler = defaultHandler();

handler.post(stripePayment);

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

        const blockQuota = stripeSubscription.items.data[0]?.quantity;

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
              paidTier: paidTier === 'enterprise' ? 'enterprise' : 'community',
              blockQuota: blockQuota && space.blockQuota !== blockQuota ? blockQuota : undefined
            }
          })
        ]);
        if (invoice.billing_reason === 'subscription_create' && invoice.payment_intent) {
          // The subscription automatically activates after successful payment
          // Set the payment method used to pay the first invoice
          // as the default payment method for that subscription

          const paymentIntent = await stripeClient.paymentIntents.retrieve(invoice.payment_intent as string);

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

            if (invoice.paid) {
              const charge = invoice.charge ? await stripeClient.charges.retrieve(invoice.charge as string) : null;
              trackUserAction('subscription_payment', {
                spaceId,
                blockQuota,
                period,
                status: 'success',
                subscriptionId: stripeSubscription.id,
                paymentMethod: invoice.metadata?.transaction_hash
                  ? 'crypto'
                  : charge?.payment_method_details?.type?.startsWith('ach')
                    ? 'ach'
                    : 'card',
                userId: space.createdBy
              });
            }
          }

          trackUserAction('create_subscription', {
            blockQuota,
            period,
            spaceId,
            userId: space.createdBy,
            subscriptionId: stripeSubscription.id
          });
        }

        log.info(
          `The invoice number ${invoice.id} for the subscription ${stripeSubscription.id} was paid for the spaceId ${spaceId}`
        );

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
                paidTier: true,
                createdBy: true
              }
            }
          }
        });

        if (!spaceSubscription) {
          log.warn(`Can't update the space subscription. Space subscription not found with id ${subscription.id}`, {
            spaceId,
            subscriptionId: subscription.id
          });
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
        } else {
          const activeSubscription = await getActiveSpaceSubscription({ spaceId });
          if (activeSubscription) {
            trackUserAction('update_subscription', {
              blockQuota: subscription.items.data[0].quantity as number,
              period: subscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'annual',
              previousBlockQuota: activeSubscription.blockQuota,
              previousPeriod: activeSubscription.period,
              subscriptionId: activeSubscription.id,
              spaceId,
              userId: space.createdBy
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

        if (!stripeSubscription.metadata.loopCheckout && priceId) {
          await stripeClient.subscriptions.update(subscriptionId, {
            metadata: {
              ...(stripeSubscription.metadata || {})
            }
          });

          log.info(`Loop checkout url was successfully added in stripe metadata`, { spaceId, priceId, subscriptionId });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const spaceId = subscription.metadata.spaceId as string;
        const spaceSubscription = await prisma.stripeSubscription.findUnique({
          where: {
            subscriptionId: subscription.id,
            spaceId,
            deletedAt: null
          },
          select: {
            id: true,
            deletedAt: true
          }
        });

        if (!spaceSubscription) {
          // Continue only of the subscription deletion was triggered from the stripe dashboard and there is an active space subscription.
          break;
        }

        const afterUpdate = await prisma.stripeSubscription.update({
          where: {
            spaceId,
            subscriptionId: subscription.id,
            deletedAt: null
          },
          data: {
            deletedAt: new Date()
          },
          select: {
            space: {
              select: {
                paidTier: true,
                createdBy: true
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
              updatedAt: new Date(),
              paidTier: 'cancelled'
            }
          });

          trackUserAction('cancel_subscription', {
            blockQuota: subscription.items.data[0].quantity as number,
            subscriptionId: subscription.id,
            spaceId,
            userId: afterUpdate.space.createdBy
          });

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
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const stripeSubscription = await stripeClient.subscriptions.retrieve(subscriptionId);
        const spaceId = stripeSubscription.metadata.spaceId;
        const blockQuota = stripeSubscription.items.data[0]?.quantity as number;
        const period = stripeSubscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'annual';
        const customerId = invoice.customer;
        const paymentMethodId = invoice.default_payment_method;
        const amountDue = invoice.amount_due;

        const space = await prisma.space.findUnique({
          where: {
            id: spaceId
          },
          select: {
            createdBy: true
          }
        });

        if (invoice.charge && space) {
          const charge = await stripeClient.charges.retrieve(invoice.charge as string);
          trackUserAction('subscription_payment', {
            spaceId,
            blockQuota,
            period,
            status: 'failure',
            subscriptionId: stripeSubscription.id,
            paymentMethod: invoice.metadata?.transaction_hash
              ? 'crypto'
              : charge.payment_method_details?.type?.startsWith('ach')
                ? 'ach'
                : 'card',
            userId: space.createdBy
          });
        }

        const lastFinalizationError = invoice.last_finalization_error;
        log.warn(`Invoice payment failed for invoice ${invoice.id} for the subscription ${stripeSubscription.id}`, {
          spaceId,
          blockQuota,
          period,
          customerId,
          paymentMethodId,
          amountDue,
          invoiceId: invoice.id,
          subscriptionId,
          message: lastFinalizationError?.message,
          code: lastFinalizationError?.code,
          type: lastFinalizationError?.type
        });
        break;
      }

      default: {
        log.debug(`Unhandled event type in stripe webhook: ${event.type}`);
        break;
      }
    }

    return res.status(200).json({});
  } catch (err: any) {
    log.warn('Stripe webhook failed to construct event', err);
    return res.status(400).json(`Webhook Error: ${err?.message}`);
  }
}

export default handler;
