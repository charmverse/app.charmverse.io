
import { closeNewApplicationsAndSubmissions, getBounty } from 'lib/bounties';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { BountyWithDetails } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(closeSubmissionsController);

async function closeSubmissionsController (req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {

  const { id: bountyId } = req.query;

  const bounty = await getBounty(bountyId as string);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found`);
  }

  const userId = req.session.user.id;

  const { error, isAdmin } = await hasAccessToSpace({
    userId,
    spaceId: bounty.spaceId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  if (bounty.reviewer !== userId && isAdmin !== true) {
    throw new UnauthorisedActionError('You cannot close submissions for this bounty.');
  }

  const bountyWithClosedSubmissions = await closeNewApplicationsAndSubmissions(bountyId as string);

  return res.status(200).json(bountyWithClosedSubmissions);
}

export default withSessionRoute(handler);

// --------- Add logging events
// These events as
