import { prisma } from "@charmverse/core/prisma-client";
import { RateLimit } from "async-sema";
import { createProSubscription } from "lib/subscription/createProSubscription";


// Rate limits for stripe: test mode: 24 // production: 100
// https://stripe.com/docs/rate-limits
const rateLimit = RateLimit(24)

async function provisionFreeTrials() {
  const spacesToProvision = await prisma.space.findMany({
    where: {
      stripeSubscription: {
        none: {}
      }
    },
    select: {
      id: true,
      name: true,
      domain: true
    }
  });

  const totalSpaces = spacesToProvision.length;

  for (let i = 0; i < totalSpaces; i++) {
    const space = spacesToProvision[i]
    await rateLimit();
    await createProSubscription({
      //    billingEmail: undefined as any,
      period: 'monthly',
      spaceId: space.id,
      name: space.name,
      freeTrial: true,
      blockQuota: 30
    });

    console.log(`Created subscription for space ${space.name}`)
    console.log(`Processed`, i +1, '/', totalSpaces, 'total space')
  } 
}

provisionFreeTrials()