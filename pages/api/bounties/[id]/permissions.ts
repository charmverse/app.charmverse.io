
import { closeOutBounty, getBounty } from 'lib/bounties';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { BountyWithDetails } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(closeBountyController);

async function closeBountyController (req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {

  const { id: bountyId } = req.query;

  const bounty = await getBounty(bountyId as string);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found`);
  }

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: bounty.id,
    userId
  });

  if (!permissions.lock) {
    throw new UnauthorisedActionError('You do not have the permission to close this bounty');
  }

  const completeBounty = await closeOutBounty(bountyId as string);

  return res.status(200).json(completeBounty);
}

export default withSessionRoute(handler);

// --------- Add logging events
// These events as
