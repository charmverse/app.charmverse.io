import type { StripeSubscription } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { SubscriptionProductId } from './constants';
import { stripeClient } from './stripe';

export type SpaceSubscription = Omit<StripeSubscription, 'productId'> & { productId: SubscriptionProductId };

export async function getSpaceSubscription({ spaceId }: { spaceId: string }) {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      stripeSubscription: {
        where: {
          deletedAt: null
        },
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  const activeSpaceSubscription = space?.stripeSubscription[0];

  if (!activeSpaceSubscription) {
    return null;
  }

  const subscriptionInStripe = await stripeClient.subscriptions.retrieve(activeSpaceSubscription.subscriptionId);

  const blockQuota = subscriptionInStripe.items.data[0].quantity;

  return { ...activeSpaceSubscription, blockQuota } as SpaceSubscription;
}
