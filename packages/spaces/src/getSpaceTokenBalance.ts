import { prisma } from '@charmverse/core/prisma-client';
import { formatUnits } from 'viem';

export type SpaceTokenBalance = {
  value: bigint;
  formatted: number;
  payments: { createdAt: Date; paidTokenAmount: string }[];
  contributions: {
    createdAt: Date;
    devTokenAmount: string;
    txHash: string | null;
    user: null | { avatar: string | null; username: string };
  }[];
};

export async function getSpaceTokenBalance({ spaceId }: { spaceId: string }): Promise<SpaceTokenBalance> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    include: {
      subscriptionPayments: {
        select: {
          createdAt: true,
          paidTokenAmount: true
        }
      },
      subscriptionContributions: {
        select: {
          createdAt: true,
          devTokenAmount: true,
          txHash: true,
          user: {
            select: {
              avatar: true,
              username: true
            }
          }
        }
      }
    }
  });

  const subscriptionPaymentsAmount = space.subscriptionPayments.reduce(
    (acc, curr) => acc + BigInt(curr.paidTokenAmount),
    BigInt(0)
  );
  const subscriptionContributionsAmount = space?.subscriptionContributions.reduce(
    (acc, curr) => acc + BigInt(curr.devTokenAmount),
    BigInt(0)
  );

  const remainingSpaceTokenBalance = subscriptionContributionsAmount - subscriptionPaymentsAmount;

  return {
    payments: space.subscriptionPayments,
    contributions: space.subscriptionContributions,
    value: remainingSpaceTokenBalance,
    formatted: Number(formatUnits(remainingSpaceTokenBalance, 18))
  };
}
