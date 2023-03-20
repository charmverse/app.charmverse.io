import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { closeOutBounty, getBountyOrThrow } from 'lib/bounties';
import type { BountyWithDetails } from 'lib/bounties';
import { markBountyAsPaid } from 'lib/bounties/markBountyAsPaid';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(markBountyAsPaidController);

async function markBountyAsPaidController(req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {
  const { id: bountyId } = req.query as { id: string };

  const bounty = await getBountyOrThrow(bountyId);

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: bounty.id,
    userId
  });

  if (!permissions.lock) {
    throw new UnauthorisedActionError('You do not have the permission to mark this bounty as paid');
  }

  const completeBounty = await markBountyAsPaid(bountyId);

  return res.status(200).json(completeBounty);
}

export default withSessionRoute(handler);
