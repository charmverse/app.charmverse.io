
import { Bounty, Prisma } from '@prisma/client';
import { BountyWithApplications } from 'models';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use((req: NextApiRequest, res: NextApiResponse, next: Function) => {
    const bountyId = req.query.id;
    if (!bountyId) {
      return res.status(400).send({ error: 'Please provide a valid bountyId' });
    }
    next();
  })
  .get(getBounty)
  .put(updateBounty);

async function getBounty (req: NextApiRequest, res: NextApiResponse<BountyWithApplications>) {
  const { id } = req.query;

  const bounty = await prisma.bounty.findUnique({
    where: {
      id: id as string
    },
    include: {
      applications: true,
      transactions: true
    }
  });

  if (!bounty) {
    return res.status(421).send({ error: 'Bounty not found' } as any);
  }

  res.status(200).json(bounty as any as BountyWithApplications);

}

async function updateBounty (req: NextApiRequest, res: NextApiResponse<BountyWithApplications>) {
  const { id } = req.query;

  const { body } = req;

  const bounty = await prisma.bounty.update({
    where: {
      id: id as string
    },
    data: body,
    include: {
      applications: true,
      transactions: true
    }
  });

  if (!bounty) {
    return res.status(421).send({ error: 'Bounty not found' } as any);
  }

  res.status(200).json(bounty);

}

export default withSessionRoute(handler);
