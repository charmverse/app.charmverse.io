import { prisma } from '@charmverse/core/prisma-client';
import { withSessionRoute } from '@root/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { formatUnits } from 'viem';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getSpaceTokenBalanceController);

async function getSpaceTokenBalanceController(req: NextApiRequest, res: NextApiResponse<number>) {
  const { id: spaceId } = req.query as { id: string };

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
          paidTokenAmount: true
        }
      }
    }
  });

  const subscriptionPaymentsAmount = space?.subscriptionPayments.reduce(
    (acc, curr) => acc + BigInt(curr.paidTokenAmount),
    BigInt(0)
  );
  const spaceSubscriptionContributionsAmount = space?.spaceSubscriptionContributions.reduce(
    (acc, curr) => acc + BigInt(curr.paidTokenAmount),
    BigInt(0)
  );
  const remainingSpaceTokenBalance = spaceSubscriptionContributionsAmount - subscriptionPaymentsAmount;

  res.status(200).json(Number(formatUnits(remainingSpaceTokenBalance, 18)));
}

export default withSessionRoute(handler);
