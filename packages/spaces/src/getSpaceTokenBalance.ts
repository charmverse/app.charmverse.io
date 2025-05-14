import { prisma } from '@charmverse/core/prisma-client';
import { formatUnits } from 'viem';

export async function getSpaceTokenBalance({ spaceId }: { spaceId: string }) {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionPayments: {
        select: {
          paidTokenAmount: true
        }
      },
      spaceSubscriptionContributions: {
        select: {
          devTokenAmount: true
        }
      }
    }
  });

  const subscriptionPaymentsAmount = space?.subscriptionPayments.reduce(
    (acc, curr) => acc + BigInt(curr.paidTokenAmount),
    BigInt(0)
  );
  const spaceSubscriptionContributionsAmount = space?.spaceSubscriptionContributions.reduce(
    (acc, curr) => acc + BigInt(curr.devTokenAmount),
    BigInt(0)
  );

  const remainingSpaceTokenBalance = spaceSubscriptionContributionsAmount - subscriptionPaymentsAmount;

  return Number(formatUnits(remainingSpaceTokenBalance, 18));
}
