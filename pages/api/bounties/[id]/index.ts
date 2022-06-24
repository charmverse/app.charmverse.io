
import { prisma } from 'db';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { BountyWithDetails } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc, { NextHandler } from 'next-connect';
import { updateBountySettings, getBounty } from 'lib/bounties';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { requesterCanDeleteBounty } from 'lib/bounties/shared';

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
      applications: true
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

  const userId = req.session.user.id;

  const { error, isAdmin } = await hasAccessToSpace({
    userId,
    spaceId: bounty.spaceId,
    adminOnly: false
  });

  // User not a space member
  if (error) {
    throw error;
  }

  // The suggester or admin can update a suggestion
  if (bounty.status === 'suggestion' && !isAdmin && bounty.createdBy !== userId) {
    throw new UnauthorisedActionError('You need to have created this suggestion or be a workspace admin to edit it.');

  // The suggester or admin can update a bounty
  // Keeping these logic branches separate for upcoming more fine grained bounty permissions
  }
  else if (bounty.status !== 'suggestion' && !isAdmin && bounty.createdBy !== userId) {
    throw new UnauthorisedActionError('Only space administrators and the bounty creator can edit active bounties.');
  }

  if (bounty.status === 'suggestion' && bounty.createdBy === userId) {
    delete body.rewardAmount;
  }

  await updateBountySettings({
    bountyId: id as string,
    updateContent: body
  });

  const rolledUpBounty = await rollupBountyStatus(bounty.id);

  res.status(200).json(rolledUpBounty);

}

async function deleteBounty (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const bounty = await getBounty(id as string);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${id} not found.`);
  }

  const userId = req.session.user.id;

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: bounty.spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  const canDeleteBounty = requesterCanDeleteBounty({
    bounty,
    requesterCreatedBounty: bounty.createdBy === userId,
    requesterIsAdmin: !!isAdmin
  });

  if (!canDeleteBounty) {
    throw new UnauthorisedActionError('You cannot delete this bounty suggestion.');
  }

  await prisma.bounty.delete({
    where: {
      id: id as string
    }
  });

  res.status(200).json({ success: true });

}

export default withSessionRoute(handler);
