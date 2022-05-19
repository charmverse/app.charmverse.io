
import { prisma } from 'db';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { BountyWithDetails } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc, { NextHandler } from 'next-connect';
import { updateBountySettings, getBounty } from 'lib/bounties';
import { DataNotFoundError } from '../../../../lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use((req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    const bountyId = req.query.id;
    if (!bountyId) {
      return res.status(400).send({ error: 'Please provide a valid bountyId' });
    }
    next();
  })
  .get(getBountyController)
  .put(updateBounty)
  .delete(deleteBounty);

async function getBountyController (req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {
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

  const bounty = await getBounty(id as string);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${id} was not found`);
  }

  const updatedBounty = await updateBountySettings({
    bountyId: id as string,
    updateContent: body
  });

  const bountyToSend: BountyWithDetails = {
    ...bounty,
    ...updatedBounty
  };

  res.status(200).json(bountyToSend);

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
