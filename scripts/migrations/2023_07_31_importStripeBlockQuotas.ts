import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { updateTrackGroupProfile } from '@packages/metrics/mixpanel/updateTrackGroupProfile';
import { communityProduct } from 'lib/subscription/constants';
import { stripeClient } from 'lib/subscription/stripe';
import type Stripe from 'stripe';

async function importStripeBlockQuotas({ status }: { status: Stripe.Subscription.Status }) {
  let hasMore = true;
  let cursor: string | undefined = undefined;
  let page = 0;

  let totalSpacesProcessed = 0;

  console.log('\r\n------ Processing subscriptions with status:', status);

  while (hasMore) {
    page += 1;

    const subscriptions = (await stripeClient.subscriptions.list({
      starting_after: cursor,
      status,
      limit: 10
    })) as Stripe.Response<Stripe.ApiList<Stripe.Subscription>>;

    cursor = subscriptions.data[0]?.id;

    if (!cursor) {
      hasMore = false;
    }

    const filteredSubs = subscriptions.data
      .filter((sub) => {
        // Only process subscriptions for community product
        return sub.items.data[0].plan.product === communityProduct.id && stringUtils.isUUID(sub.metadata['spaceId']);
      })
      .map(
        (sub) =>
          ({
            subscriptionId: sub.id,
            spaceId: sub.metadata['spaceId'],
            blockQuota: sub.items.data[0].quantity
          }) as { spaceId: string; subscriptionId: string; blockQuota: number }
      );

    if (filteredSubs.length > 0) {
      const spacesToUpdate = await prisma.space.findMany({
        where: {
          id: {
            in: filteredSubs.map((sub) => sub.spaceId)
          }
        },
        select: {
          id: true
        }
      });

      const updatedSpaces = await prisma.$transaction(
        spacesToUpdate.map((space) =>
          prisma.space.update({
            where: {
              id: space.id
            },
            data: {
              blockQuota: filteredSubs.find((sub) => sub.spaceId === space.id)?.blockQuota
            }
          })
        )
      );

      await Promise.all(updatedSpaces.map((space) => updateTrackGroupProfile(space)));

      totalSpacesProcessed += updatedSpaces.length;

      console.log(`Updated ${updatedSpaces.length} space(s) in page`, page);
    } else {
      console.log(`No spaces to update in page`, page);
    }

    console.log(`Processed page ${page}`, { cursor, hasMore, status }, '\r\n\r\n');

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  console.log('Processed', totalSpacesProcessed, 'space subscriptions with', status, 'status');
}

// Just in case a space has a trial sub and active sub, this will prevent overwriting paid plan data with trial plan data
importStripeBlockQuotas({ status: 'trialing' })
  .then()
  .then(() => importStripeBlockQuotas({ status: 'active' }))
  .then((spacesProcessed) => {
    console.log('Processed', spacesProcessed, 'spaces');
  });
