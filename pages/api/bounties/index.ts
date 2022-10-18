
import type { Bounty } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BountyCreationData, BountyWithDetails } from 'lib/bounties';
import { createBounty, listAvailableBounties } from 'lib/bounties';
import * as collabland from 'lib/collabland';
import log from 'lib/log';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { logUserFirstBountyEvents, logWorkspaceFirstBountyEvents } from 'lib/metrics/postToDiscord';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { AvailableResourcesRequest } from 'lib/permissions/interfaces';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getBounties)
  .use(requireUser)
  .post(createBountyController);

async function getBounties (req: NextApiRequest, res: NextApiResponse<Bounty[]>) {
  const { spaceId, publicOnly } = req.query as any as AvailableResourcesRequest;

  const publicResourcesOnly = ((publicOnly as any) === 'true' || publicOnly === true);

  // Session may be undefined as non-logged in users can access this endpoint
  const userId = req.session?.user?.id;

  const bounties = await listAvailableBounties({
    spaceId: spaceId as string,
    userId: publicResourcesOnly ? undefined : userId
  });
  return res.status(200).json(bounties);

}

async function createBountyController (req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {

  const { spaceId, status } = req.body as BountyCreationData;

  const { id: userId } = req.session.user;

  if (status === 'suggestion') {
    const { error } = await hasAccessToSpace({
      spaceId,
      userId,
      adminOnly: false
    });

    if (error) {
      throw error;
    }
  }
  else {
    const userPermissions = await computeSpacePermissions({
      allowAdminBypass: true,
      resourceId: spaceId as string,
      userId
    });
    if (!userPermissions.createBounty) {
      throw new UnauthorisedActionError('You do not have permissions to create a bounty.');
    }
  }

  const createdBounty = await createBounty({
    ...req.body,
    createdBy: req.session.user.id
  });

  // add a little delay to capture the full bounty title after user has edited it
  setTimeout(() => {
    const { id, rewardAmount, rewardToken, page } = createdBounty;
    collabland.createBountyCreatedCredential({ bountyId: id })
      .catch(err => {
        log.error('Error creating bounty created credential', err);
      });

    trackUserAction(
      'bounty_created',
      { userId, spaceId, resourceId: id, rewardToken, rewardAmount, pageId: page.id }
    );

  }, 60 * 1000);

  logWorkspaceFirstBountyEvents(createdBounty);
  logUserFirstBountyEvents(createdBounty);

  return res.status(201).json(createdBounty);
}

export default withSessionRoute(handler);

// --------- Add logging events
// These events assume the entity has been created
