
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { closeOutBounty, getBountyOrThrow } from 'lib/bounties';
import type { BountyWithDetails } from 'lib/bounties';
import * as collabland from 'lib/collabland';
import log from 'lib/log';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(closeBountyController);

async function closeBountyController (req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {

  const { id: bountyId } = req.query as { id: string };

  const bounty = await getBountyOrThrow(bountyId);

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: bounty.id,
    userId
  });

  if (!permissions.lock) {
    throw new UnauthorisedActionError('You do not have the permission to close this bounty');
  }

  const completeBounty = await closeOutBounty(bountyId);

  const completedApplications = completeBounty.applications.filter((application) => application.status === 'complete');

  for (const application of completedApplications) {

    collabland.createBountyCompletedCredential({
      bountyId,
      userId: application.createdBy
    })
      .catch(error => {
        log.error('Error creating a collabland VC for completing bounty', error);
      });
  }

  return res.status(200).json(completeBounty);
}

export default withSessionRoute(handler);
