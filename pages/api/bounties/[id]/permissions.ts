
import { closeOutBounty, getBounty } from 'lib/bounties';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { AssignedBountyPermissions, computeBountyPermissions, queryBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { BountyWithDetails } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(computeBountyGroupPermissionsController);

async function computeBountyGroupPermissionsController (req: NextApiRequest, res: NextApiResponse<AssignedBountyPermissions>) {

  const { id: bountyId } = req.query;

  const bounty = await getBounty(bountyId as string);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found`);
  }

  const userId = req.session.user.id;

  const [permissions, groups] = await Promise.all([
    computeBountyPermissions({
      allowAdminBypass: true,
      resourceId: bounty.id,
      userId
    }),
    queryBountyPermissions({ bountyId: bounty.id })
  ]);

  return res.status(200).json({
    // Groups assigned to each level
    bountyPermissions: groups,
    // Individual actions user can and cannot perform
    userPermissions: permissions
  });
}

export default withSessionRoute(handler);

// --------- Add logging events
// These events as
