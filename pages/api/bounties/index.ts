
import { Bounty, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { IEventToLog, postToDiscord } from 'lib/log/userEvents';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getBounties).post(createBounty);

async function getBounties (req: NextApiRequest, res: NextApiResponse<Bounty[]>) {
  const { spaceId } = req.query;

  if (typeof spaceId !== 'string') {
    return res.status(400).send({ error: 'Please provide a valid spaceId' } as any);
  }

  const bounties = await prisma.bounty.findMany({
    where: {
      spaceId
    },
    include: {
      applications: true
    }
  });
  return res.status(200).json(bounties);
}

async function createBounty (req: NextApiRequest, res: NextApiResponse<Bounty>) {
  const data = req.body as Bounty;
  const bountyToCreate = { ...data } as any;

  if (data.createdBy) {
    (bountyToCreate as Prisma.BountyCreateInput).author = { connect: { id: data.createdBy } };

    // Remove createdBy passed from client to ensure Prisma doesn't throw an error
    delete bountyToCreate.createdBy;
  }

  if (data.spaceId) {
    (bountyToCreate as Prisma.BountyCreateInput).space = { connect: { id: data.spaceId } };
    delete bountyToCreate.spaceId;
  }

  if (bountyToCreate.status === 'suggestion') {
    bountyToCreate.suggestedBy = req.session.user.id;
  }

  const bounty = await prisma.bounty.create({ data: bountyToCreate });

  logWorkspaceFirstBountyEvents(bounty);
  logUserFirstBountyEvents(bounty);

  return res.status(200).json(bounty);
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
