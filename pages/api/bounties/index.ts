
import { Bounty, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getBounties).post(createBounty);

async function getBounties (req: NextApiRequest, res: NextApiResponse<Bounty[]>) {
  const { spaceId } = req.query;

  if (spaceId === undefined) {
    return res.status(400).send({ error: 'Please provide a valid spaceId' } as any);
  }

  const bountyListQuery: Prisma.BountyFindManyArgs = spaceId ? {
    where: {
      spaceId
    }
  } : {} as any;

  const bounties = await prisma.bounty.findMany(bountyListQuery);
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

  const bounty = await prisma.bounty.create({ data: bountyToCreate });
  return res.status(200).json(bounty);
}

export default withSessionRoute(handler);
