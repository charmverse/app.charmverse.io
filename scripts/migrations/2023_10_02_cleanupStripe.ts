import { prisma } from "@charmverse/core/prisma-client";
import { arrayUtils } from "@charmverse/core/utilities";
import { stripeClient } from "lib/subscription/stripe";
import Stripe from "stripe";



let processed = 0;

// Request customer IDs from team
const ignoredCustomerIds: string[] = [
]

if (!ignoredCustomerIds.some(c => c.startsWith('cus'))) {
  throw new Error('No customer IDs provided for ignore list')
}


// Script 1 - Delete irrelevant subscriptions
export async function cleanupStripe(cursor?: string): Promise<void> {

  let subs = await stripeClient.subscriptions.list({
    starting_after: cursor,
    expand: ['data.items', 'data.items.data.plan'],
    limit: 4,
    created: {
      // Feb 2nd 2023
      gt: 1683049611
    } 
  });

  for (const sub of subs.data) {
    if (!ignoredCustomerIds.some(c => c === sub.customer) && sub.items.data.some(i => i.plan.product === 'community')) {
      // await stripeClient.subscriptions.del(sub.customer as string, {invoice_now: false})
      await prisma.stripeSubscription.delete({
        where: {
          id: sub.id
        }
      })
    }
  }
  const newCursor = subs.data[subs.data.length - 1].id;

  processed += subs.data.length;

  console.log('Total Processed', processed, 'Cursor:', newCursor, 'CUST', ignoredCustomerIds.length, 'Subs:', subs.data.map(s => s.id), 'Will Process')

  if (subs.has_more) {
    return cleanupStripe(newCursor)
  }
}


// Script 2 - Migrate spaces
async function migrateSpaces() {

  const customers = await Promise.all(ignoredCustomerIds.map(cust => {
    return stripeClient.customers.retrieve(cust, {expand: ['subscriptions']}) as Promise<Stripe.Customer>
  }))

  const ignoredSpaceIds = customers.map(c => c.metadata.spaceId);


  await prisma.space.updateMany({
    where: {
      paidTier: 'cancelled',
      id: {
        notIn: ignoredSpaceIds
      }
    },
    data: {
      paidTier: 'community'
    }
  })

  // Catch any stripe subscriptions we didnt catch in first
  await prisma.stripeSubscription.deleteMany({
    where: {
      spaceId: {
        notIn: ignoredSpaceIds
      }
    }
  })

  console.log(ignoredSpaceIds.sort(), arrayUtils.uniqueValues(ignoredSpaceIds).length)
}

migrateSpaces().then(() => console.log('done'))
// cleanupStripe().then(() => console.log('done'))