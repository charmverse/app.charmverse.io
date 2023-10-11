import type { Bounty as Reward } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { logUserFirstBountyEvents, logWorkspaceFirstBountyEvents } from 'lib/metrics/postToDiscord';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { AvailableResourcesRequest } from 'lib/permissions/interfaces';
import type { RewardCreationData } from 'lib/rewards/createReward';
import { createReward } from 'lib/rewards/createReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(
    providePermissionClients({
      key: 'spaceId',
      location: 'query',
      resourceIdType: 'space'
    }),
    getBounties
  )
  .use(requireUser)
  .post(
    providePermissionClients({
      key: 'spaceId',
      location: 'body',
      resourceIdType: 'space'
    }),
    createRewardController
  );

async function getBounties(req: NextApiRequest, res: NextApiResponse<Reward[]>) {
  const { spaceId, publicOnly } = req.query as any as AvailableResourcesRequest;

  const publicResourcesOnly = (publicOnly as any) === 'true' || publicOnly === true;

  // Session may be undefined as non-logged in users can access this endpoint
  const userId = req.session?.user?.id;

  const bounties = await req.basePermissionsClient.spaces.listAvailableBounties({
    spaceId: spaceId as string,
    userId: publicResourcesOnly ? undefined : userId
  });
  return res.status(200).json(bounties);
}

async function createRewardController(req: NextApiRequest, res: NextApiResponse<RewardWithUsers>) {
  const { spaceId, status, linkedPageId } = req.body as RewardCreationData;

  const { id: userId } = req.session.user;

  if (status === 'suggestion') {
    const { error } = await hasAccessToSpace({
      spaceId,
      userId,
      adminOnly: false,
      disallowGuest: true
    });

    if (error) {
      throw error;
    }
  } else {
    const userPermissions = await req.basePermissionsClient.spaces.computeSpacePermissions({
      resourceId: spaceId as string,
      userId
    });
    if (!userPermissions.createBounty) {
      throw new UnauthorisedActionError('You do not have permissions to create a bounty.');
    }
  }

  const createdReward = await createReward({
    ...req.body,
    createdBy: req.session.user.id
  });

  if (linkedPageId) {
    relay.broadcast(
      {
        type: 'pages_meta_updated',
        payload: [{ bountyId: createdReward.id, spaceId: createdReward.spaceId, id: linkedPageId }]
      },
      createdReward.spaceId
    );
  }

  // add a little delay to capture the full bounty title after user has edited it
  setTimeout(() => {
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
  }, 60 * 1000);

  logWorkspaceFirstBountyEvents(createdReward);
  logUserFirstBountyEvents(createdReward);

  return res.status(201).json(createdReward);
}

export default withSessionRoute(handler);

// --------- Add logging events
// These events assume the entity has been created
