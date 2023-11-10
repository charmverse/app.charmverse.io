import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import type { BountyPermissionFlags } from 'lib/permissions/bounties';
import { computeBountyPermissions } from 'lib/permissions/bounties/computeBountyPermissions';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(computeRewardPermissionsController);

async function computeRewardPermissionsController(req: NextApiRequest, res: NextApiResponse<BountyPermissionFlags>) {
  const { id: rewardId } = req.query as { id: string };

  const permissions = await computeBountyPermissions({
    resourceId: rewardId,
    userId: req.session.user?.id
  });

  return res.status(200).json(permissions);
}

export default withSessionRoute(handler);
