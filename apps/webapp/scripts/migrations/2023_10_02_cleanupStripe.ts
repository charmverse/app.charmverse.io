import { prisma } from '@charmverse/core/prisma-client';
import { stripeClient } from 'lib/subscription/stripe';
import { writeToSameFolder } from 'lib/utils/file';

let processed = 0;
let total = 0;

// Request customer IDs from team
const ignoredCustomerIds: string[] = [];

if (!ignoredCustomerIds.some((c) => c.startsWith('cus'))) {
  throw new Error('No customer IDs provided for ignore list');
}

// Script 1 - Delete irrelevant subscriptions
export async function cleanupStripe(cursor?: string): Promise<void> {
  let customers = await stripeClient.customers.list({
    created: {
      // March 4th
      gt: 1677935503
    },
    limit: 100,
    starting_after: cursor
  });

  for (const cus of customers.data) {
    if (typeof cus.id === 'string' && cus.id.startsWith('cus') && !ignoredCustomerIds.includes(cus.id)) {
      processed += 1;
      await stripeClient.customers.del(cus.id).catch((err) => {
        const issue = `Error deleting in STRIPE for ${cus.metadata.domain} // ${cus.metadata.spaceId} ${err}`;
        writeToSameFolder({ fileName: 'stripelog.txt', data: issue, append: true });
        console.log(issue);
      });
      await prisma.stripeSubscription.deleteMany({
        where: {
          customerId: cus.id
        }
      });
    }
  }

  const newCursor = customers.data[customers.data.length - 1].id;

  total += customers.data.length;

  console.log('Total Processed', processed, 'Cursor:', newCursor, 'Position', total);

  if (customers.has_more) {
    return cleanupStripe(newCursor);
  }
}

// Script 2 - Migrate spaces
async function migrateSpaces() {
  await prisma.space.updateMany({
    where: {
      paidTier: 'cancelled'
    },
    data: {
      paidTier: 'community'
    }
  });
}

// Script 3 - Migrate spaces
async function dropCancelled() {
  const subscription = await prisma.stripeSubscription.findMany({});

  for (const sub of subscription) {
    try {
      const stripeSub = await stripeClient.subscriptions.retrieve(sub.subscriptionId);
      if (stripeSub.status === 'canceled') {
        await prisma.stripeSubscription.delete({
          where: {
            id: sub.id
          }
        });
      }
    } catch (err) {
      console.log((err as any).code);
    }
  }
}

//migrateSpaces().then(() => console.log('done'))
// cleanupStripe().then(() => console.log('done'))
// dropCancelled().then(() => console.log('done'))

// prisma.space.findMany({
//   where: {
//     stripeSubscription: {
//       some: {}
//     }
//   },
//   select: {
//     domain: true,
//     stripeSubscription: {
//       select: {
//         customerId: true,
//         subscriptionId: true
//       }
//     }
//   }
// }).then(count => console.log(JSON.stringify(count, null, 2)))
