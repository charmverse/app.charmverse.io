
import { BountySubmitterPoolSize, getBounty, calculateBountySubmitterPoolSize } from 'lib/bounties';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { BountyPermissions, computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(getBountySubmitterPoolPermissionsController);

async function getBountySubmitterPoolPermissionsController (req: NextApiRequest, res: NextApiResponse<BountySubmitterPoolSize>) {

  const { id: bountyId, permissions: permissionsForSimulation } = req.query as any;

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

  if (!permissions.view) {
    const emptyPool: BountySubmitterPoolSize = {
      mode: 'space',
      roleups: [],
      total: 0
    };
    return res.status(200).json(emptyPool);
  }

  const pool = await calculateBountySubmitterPoolSize({
    resourceId: bounty.id,
    // May be undefined
    permissions: permissionsForSimulation as Partial<BountyPermissions>
  });

  return res.status(200).json(pool);
}

export default withSessionRoute(handler);
