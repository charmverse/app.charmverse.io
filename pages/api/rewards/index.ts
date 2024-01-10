import { hasAccessToSpace } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { logUserFirstBountyEvents, logWorkspaceFirstBountyEvents } from 'lib/metrics/postToDiscord';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { getPageMetaList } from 'lib/pages/server/getPageMetaList';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { upsertDefaultRewardsBoard } from 'lib/rewards/blocks/upsertDefaultRewardsBoard';
import type { RewardCreationData } from 'lib/rewards/createReward';
import { createReward } from 'lib/rewards/createReward';
import { rewardWithUsersInclude } from 'lib/rewards/getReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { mapDbRewardToReward } from 'lib/rewards/mapDbRewardToReward';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getRewards).use(requireUser).post(createRewardController);

async function getRewards(req: NextApiRequest, res: NextApiResponse<RewardWithUsers[]>) {
  const spaceId = req.query.spaceId as string;

  // Session may be undefined as non-logged in users can access this endpoint
  const userId = req.session?.user?.id;

  const { spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      publicBountyBoard: true
    }
  });

  if (!spaceRole && !space.publicBountyBoard) {
    throw new ActionNotPermittedError(`You cannot access the rewards list`);
  }

  const accessiblePageIds = await permissionsApiClient.pages.getAccessiblePageIds({
    spaceId,
    userId
  });

  const rewards = await prisma.bounty
    .findMany({
      where: {
        page: {
          id: {
            in: accessiblePageIds
          },
          // bounty templates have separate endpoint
          type: {
            notIn: ['bounty_template']
          }
        }
      },
      include: rewardWithUsersInclude()
    })
    .then((_rewards) => _rewards.map(mapDbRewardToReward));

  return res.status(200).json(rewards);
}

async function createRewardController(req: NextApiRequest, res: NextApiResponse<RewardWithUsers>) {
  const { spaceId, linkedPageId } = req.body as RewardCreationData;

  const { id: userId } = req.session.user;

  const userPermissions = await permissionsApiClient.spaces.computeSpacePermissions({
    resourceId: spaceId as string,
    userId
  });
  if (!userPermissions.createBounty) {
    throw new UnauthorisedActionError('You do not have permissions to create a reward.');
  }

  const { reward: createdReward, createdPageId } = await createReward({
    ...req.body,
    userId: req.session.user.id
  });

  if (linkedPageId) {
    relay.broadcast(
      {
        type: 'pages_meta_updated',
        payload: [{ bountyId: createdReward.id, spaceId: createdReward.spaceId, id: linkedPageId }]
      },
      createdReward.spaceId
    );
  } else if (createdPageId) {
    const pages = await getPageMetaList([createdPageId]);
    relay.broadcast(
      {
        type: 'pages_created',
        payload: pages
      },
      createdReward.spaceId
    );
  }

  const { id, rewardAmount, rewardToken, customReward } = createdReward;

  trackUserAction('bounty_created', {
    userId,
    spaceId,
    resourceId: id,
    rewardToken,
    rewardAmount,
    pageId: createdReward.id,
    customReward
  });

  logWorkspaceFirstBountyEvents(createdReward);
  logUserFirstBountyEvents(createdReward);

  // Upsert reward board blocks when 1st bounty is created
  const numberOfBounties = await prisma.bounty.count({ where: { spaceId } });
  if (numberOfBounties === 1) {
    await upsertDefaultRewardsBoard({ spaceId, userId });
  }

  return res.status(201).json(createdReward);
}

export default withSessionRoute(handler);

// --------- Add logging events
// These events assume the entity has been created
