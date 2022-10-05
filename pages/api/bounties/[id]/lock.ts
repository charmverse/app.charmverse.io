
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { lockApplicationAndSubmissions, getBountyOrThrow } from 'lib/bounties';
import type { BountyWithDetails } from 'lib/bounties';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(closeSubmissionsController);

async function closeSubmissionsController (req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {

  const { id: bountyId } = req.query;

  const bounty = await getBountyOrThrow(bountyId as string);

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: bounty.id,
    userId
  });

  if (!permissions.lock) {
    throw new UnauthorisedActionError('You cannot close submissions for this bounty.');
  }

  const bountyWithClosedSubmissions = await lockApplicationAndSubmissions(bountyId as string, (!req.query.lock || req.query.lock === 'true'));

  return res.status(200).json(bountyWithClosedSubmissions);
}

export default withSessionRoute(handler);

// --------- Add logging events
// These events as
