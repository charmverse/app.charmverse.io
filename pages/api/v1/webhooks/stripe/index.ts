import { InsecureOperationError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { SubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { defaultHandler } from 'lib/public-api/handler';
import { stripeClient } from 'lib/subscription/stripe';

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

        const stripeSubscription = await stripeClient.subscriptions.retrieve(invoice.subscription as string, {
          expand: ['plan']
        });

        const spaceId = stripeSubscription.metadata.spaceId;
        // @ts-ignore The plan exists
        const subscriptionPlan = stripeSubscription.plan as Stripe.Plan;

        const space = await prisma.space.findUnique({
          where: { id: spaceId, deletedAt: null }
        });

        if (!space) {
          log.warn(`Can't update the user subscription. Space not found for subscription ${stripeSubscription.id}`);
          break;
        }
        const period = subscriptionPlan.interval === 'month' ? ('monthly' as const) : ('annual' as const);
        const productId = subscriptionPlan.product as string;

        const newData = {
          customerId: invoice.customer as string,
          subscriptionId: invoice.subscription as string,
          period,
          productId: subscriptionPlan.product as string,
          priceId: subscriptionPlan.id as string,
          spaceId,
          status: 'active' as const,
          deletedAt: null
        };

        await prisma.$transaction([
          prisma.stripeSubscription.upsert({
            where: {
              subscriptionId: stripeSubscription.id,
              spaceId
            },
            create: newData,
            update: newData
          }),
          prisma.space.update({
            where: {
              id: space.id
            },
            data: {
              paidTier: stripeSubscription.metadata.tier as SubscriptionTier
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

        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        const spaceSubscription = await prisma.stripeSubscription.findUnique({
          where: {
            spaceId: subscription.metadata.spaceId as string,
            subscriptionId: subscription.id,
            deletedAt: null,
            status: {
              not: 'cancelled'
            }
          }
        });

        if (!spaceSubscription) {
          log.warn(
            `Can't update the user subscription. Space subscription not found for subscription ${subscription.id}`
          );
          break;
        }

        const isStatusUpdate =
          (subscription.cancel_at_period_end && subscription.status === 'active') ||
          (!subscription.cancel_at_period_end && spaceSubscription.status === 'cancelAtEnd');

        if (isStatusUpdate) {
          await prisma.stripeSubscription.update({
            where: {
              id: spaceSubscription.id
            },
            data: {
              status: subscription.cancel_at_period_end ? 'cancelAtEnd' : 'active'
            }
          });
        }

        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const spaceSubscription = await prisma.stripeSubscription.findUnique({
          where: {
            spaceId: subscription.metadata.spaceId as string,
            subscriptionId: subscription.id,
            deletedAt: null,
            status: {
              not: 'cancelled'
            }
          }
        });

        if (!spaceSubscription) {
          log.warn(
            `Can't update the user subscription. Space subscription not found for subscription ${subscription.id}`
          );
          break;
        }

        await prisma.stripeSubscription.update({
          where: {
            spaceId: subscription.metadata.spaceId as string,
            subscriptionId: subscription.id,
            deletedAt: null,
            status: {
              not: 'cancelled'
            }
          },
          data: {
            deletedAt: new Date(),
            status: 'cancelled',
            space: {
              update: {
                paidTier: 'free'
              }
            }
          }
        });

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
