import { prisma } from "@charmverse/core/prisma-client";
import { arrayUtils } from "@charmverse/core/utilities";
import { stripeClient } from "lib/subscription/stripe";
import Stripe from "stripe";



let processed = 0;
let total = 0;

// Request customer IDs from team
const ignoredCustomerIds: string[] = []

if (!ignoredCustomerIds.some(c => c.startsWith('cus'))) {
  throw new Error('No customer IDs provided for ignore list')
}


// Script 1 - Delete irrelevant subscriptions
export async function cleanupStripe(cursor?: string): Promise<void> {

  let subs = await stripeClient.subscriptions.list({
    starting_after: cursor,
    expand: ['data.items', 'data.items.data.plan', 'data.customer'],
    limit: 100,
    created: {
      // Feb 2nd 2023
      gt: 1683049611
    } 
  });



  for (const sub of subs.data) {
    if (!ignoredCustomerIds.includes((sub.customer as Stripe.Customer).id) && sub.items.data.some(i => i.plan.product === 'community')) {
      processed+=1;
      console.log((sub.customer as Stripe.Customer).metadata.domain)
      await stripeClient.subscriptions.del(sub.id, {invoice_now: false})
      await prisma.stripeSubscription.delete({
        where: {
          subscriptionId: sub.id
        }
      })
      .catch(err => {
        const issue = `${(sub.customer as Stripe.Customer).metadata.domain} // ${(sub.customer as Stripe.Customer).metadata.spaceId}`;
        console.log('Error deleting for', issue, err)
      })
    }
  }
  const newCursor = subs.data[subs.data.length - 1].id;

  total += subs.data.length;

  console.log('Total Processed', processed, 'Cursor:', newCursor, 'Position', total);

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


  // await prisma.space.updateMany({
  //   where: {
  //     paidTier: 'cancelled',
  //     id: {
  //       notIn: ignoredSpaceIds
  //     }
  //   },
  //   data: {
  //     paidTier: 'community'
  //   }
  // })

  // Catch any stripe subscriptions we didnt catch in first
  await prisma.stripeSubscription.deleteMany({
    where: {
      space: {
        domain: {
          startsWith: 'cvt'
        }
      },
      spaceId: {
        notIn: ignoredSpaceIds
      }
    }
  })

  console.log(ignoredSpaceIds.sort(), arrayUtils.uniqueValues(ignoredSpaceIds).length)
}

// migrateSpaces().then(() => console.log('done'))
cleanupStripe().then(() => console.log('done'))