
import { Bounty } from '@prisma/client';
import { prisma } from 'db';
import { createBounty, listAvailableBounties } from 'lib/bounties';
import { IEventToLog, postToDiscord } from 'lib/log/userEvents';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getBounties).post(createBountyController);

async function getBounties (req: NextApiRequest, res: NextApiResponse<Bounty[]>) {
  const { spaceId } = req.query;

  if (typeof spaceId !== 'string') {
    return res.status(400).send({ error: 'Please provide a valid spaceId' } as any);
  }

  const userId = req.session.user.id;

  const bounties = await listAvailableBounties({
    spaceId,
    userId
  });

  return res.status(200).json(bounties);
}

async function createBountyController (req: NextApiRequest, res: NextApiResponse<Bounty>) {

  const { spaceId, status } = req.body as Bounty;

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
