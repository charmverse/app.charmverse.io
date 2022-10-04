
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getBountyOrThrow } from 'lib/bounties';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { AssignedBountyPermissions } from 'lib/permissions/bounties';
import { computeBountyPermissions, queryBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(computeBountyGroupPermissionsController);

async function computeBountyGroupPermissionsController (req: NextApiRequest, res: NextApiResponse<AssignedBountyPermissions>) {

  const { id: bountyId } = req.query;

  const bounty = await getBountyOrThrow(bountyId as string);

  const userId = req.session.user.id;

  const [permissions, groups] = await Promise.all([
    computeBountyPermissions({
      allowAdminBypass: false,
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
