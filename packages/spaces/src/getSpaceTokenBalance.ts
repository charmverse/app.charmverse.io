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
      subscriptionContributions: {
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
  const subscriptionContributionsAmount = space?.subscriptionContributions.reduce(
    (acc, curr) => acc + BigInt(curr.devTokenAmount),
    BigInt(0)
  );

  const remainingSpaceTokenBalance = subscriptionContributionsAmount - subscriptionPaymentsAmount;

  return { value: remainingSpaceTokenBalance, formatted: Number(formatUnits(remainingSpaceTokenBalance, 18)) };
}
