
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { BountyWithDetails } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc, { NextHandler } from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use((req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    const bountyId = req.query.id;
    if (!bountyId) {
      return res.status(400).send({ error: 'Please provide a valid bountyId' });
    }
    next();
  })
  .get(getBounty)
  .put(updateBounty)
  .delete(deleteBounty);

async function getBounty (req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {
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

  res.status(200).json(bounty as any as BountyWithDetails);

}

async function updateBounty (req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {
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

async function deleteBounty (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  await prisma.bounty.delete({
    where: {
      id: id as string
    }
  });

  res.status(200).json({ success: true });

}

export default withSessionRoute(handler);
