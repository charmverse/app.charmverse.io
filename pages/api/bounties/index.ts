
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

  const bountyListQuery: Prisma.BountyFindManyArgs = spaceId ? {
    where: {
      spaceId
    }
  } : {} as any;

  const bounties = await prisma.bounty.findMany(bountyListQuery);
  return res.status(200).json(bounties);
}

async function createBounty (req: NextApiRequest, res: NextApiResponse<Bounty>) {
  const data = req.body as Prisma.BountyCreateInput;
  // add a first page to the space

  const bounty = await prisma.bounty.create({ data });
  return res.status(200).json(bounty);
}

export default withSessionRoute(handler);
