import { log } from '@packages/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { calculateSubscriptionCost } from '@packages/subscriptions/calculateSubscriptionCost';
import { parseUnits } from 'viem';

async function upgradeSpacesToGoldTier() {
  const spaces = await prisma.space.findMany({
    where: {
      paidTier: {
        not: 'enterprise'
      },
      subscriptionTier: {
        not: 'gold'
      }
    },
    select: {
      id: true
    },
    orderBy: {
      id: 'asc'
    }
  });

  const { immediatePayment, priceForMonths } = calculateSubscriptionCost({
    paymentMonths: 1,
    newTier: 'gold'
  });

  const totalSpaces = spaces.length;
  let currentSpace = 0;

  log.info(`Upgrading ${totalSpaces} spaces to gold tier`);

  for (const space of spaces) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.space.update({
          where: { id: space.id },
          data: {
            subscriptionTier: 'gold'
          }
        });

        await tx.spaceSubscriptionPayment.create({
          data: {
            spaceId: space.id,
            paidTokenAmount: parseUnits(immediatePayment.toString(), 18).toString(),
            subscriptionPeriodStart: new Date(),
            subscriptionPrice: parseUnits(priceForMonths.toString(), 18).toString(),
            subscriptionTier: 'gold'
          }
        });

        await tx.spaceSubscriptionContribution.create({
          data: {
            spaceId: space.id,
            devTokenAmount: parseUnits(priceForMonths.toString(), 18).toString(),
            chainId: 8453,
            decentPayload: {}
          }
        });

        await tx.spaceSubscriptionTierChangeEvent.create({
          data: {
            spaceId: space.id,
            newTier: 'gold',
            previousTier: 'readonly'
          }
        });
      });
    } catch (error) {
      log.error(`Error upgrading space ${space.id} to gold tier`, error);
    } finally {
      currentSpace += 1;

      if (currentSpace % 10 === 0 || currentSpace === totalSpaces) {
        log.info(`Upgraded ${currentSpace} of ${totalSpaces} spaces to gold tier`);
      }
    }
  }
}

upgradeSpacesToGoldTier();
