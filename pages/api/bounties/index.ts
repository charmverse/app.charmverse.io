
import type { Bounty } from '@prisma/client';
import { prisma } from 'db';
import type { BountyCreationData } from 'lib/bounties';
import { createBounty, listAvailableBounties } from 'lib/bounties';
import type { IEventToLog } from 'lib/log/userEvents';
import { postToDiscord } from 'lib/log/userEvents';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { AvailableResourcesRequest } from 'lib/permissions/interfaces';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import type { BountyWithDetails } from 'models';
import type { NextApiRequest, NextApiResponse } from 'next';
import * as collabland from 'lib/collabland';
import nc from 'next-connect';
import log from 'lib/log';

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

    collabland.createBountyCreatedCredential({ bountyId: createdBounty.id })
      .catch(err => {
        log.error('Error creating bounty created credential', err);
      });

  }, 60 * 1000);

  logWorkspaceFirstBountyEvents(createdBounty);
  logUserFirstBountyEvents(createdBounty);

  return res.status(201).json(createdBounty);
}

export default withSessionRoute(handler);

// --------- Add logging events
// These events assume the entity has been created

async function logWorkspaceFirstBountyEvents (bounty: Bounty) {
  const bountiesInWorkspace = await prisma.bounty.findMany({
    where: {
      spaceId: bounty.spaceId
    }
  });

  // Only 1 bounty exists
  if (bountiesInWorkspace.length === 1) {

    const workspace = await prisma.space.findUnique({
      where: {
        id: bounty.spaceId
      }
    });

    const event: IEventToLog = {
      eventType: 'first_workspace_create_bounty',
      funnelStage: 'activation',
      message: `${workspace?.name} workspace just posted its first bounty`
    };

    postToDiscord(event);
    return true;
  }
  return false;
}

async function logUserFirstBountyEvents (bounty: Bounty) {
  const bountiesFromUser = await prisma.bounty.findMany({
    where: {
      createdBy: bounty.createdBy
    }
  });

  if (bountiesFromUser.length === 1) {

    const workspace = await prisma.space.findUnique({
      where: {
        id: bounty.spaceId
      }
    });

    const event: IEventToLog = {
      eventType: 'first_user_create_bounty',
      funnelStage: 'activation',
      message: `A user just created their first bounty inside the ${workspace?.name} workspace`
    };

    postToDiscord(event);
    return true;
  }
  return false;
}
