import Stripe from 'stripe';

import { NotFoundError } from 'lib/middleware';

import type { SpaceSubscription } from './interfaces';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15'
});

export async function getSpaceSubscription({ spaceId }: { spaceId: string }) {
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      subscriptionId: true
    }
  });

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  if (!space.subscriptionId) {
    return null;
  }

  const subscription = await stripe.subscriptions.retrieve(space.subscriptionId);

  return subscription.metadata as SpaceSubscription;
}
