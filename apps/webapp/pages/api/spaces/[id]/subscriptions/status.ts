import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

export type SpaceSubscriptionStatus = {
  tier: SpaceSubscriptionTier;
  pendingTier?: SpaceSubscriptionTier; // if the user is upgrading or downgrading next month
  // expiresAt: string;
  tokenBalance: { value: string; formatted: number };
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getSubscriptionEventsController);

async function getSubscriptionEventsController(req: NextApiRequest, res: NextApiResponse<SpaceSubscriptionStatus>) {
  const { id: spaceId } = req.query as { id: string };

  const [space, tokenBalance, subscriptionEvents] = await Promise.all([
    prisma.space.findUniqueOrThrow({
      where: {
        id: spaceId
      },
      select: {
        subscriptionTier: true
      }
    }),
    getSpaceTokenBalance({ spaceId }),
    prisma.spaceSubscriptionTierChangeEvent.findMany({
      where: {
        spaceId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    })
  ]);

  const currentTier = space.subscriptionTier || 'gold';
  const nextTier = subscriptionEvents[0].newTier;

  res.status(200).json({
    tokenBalance: {
      value: tokenBalance.value.toString(),
      formatted: tokenBalance.formatted
    },
    tier: currentTier,
    pendingTier: nextTier !== currentTier ? nextTier : undefined
  });
}

export default withSessionRoute(handler);
