
import { BountySubmitterPoolSize, getBounty, calculateBountySubmitterPoolSize, BountySubmitterPoolCalculation } from 'lib/bounties';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { BountyPermissions, computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(getBountySubmitterPoolPermissionsController);

async function getBountySubmitterPoolPermissionsController (req: NextApiRequest, res: NextApiResponse<BountySubmitterPoolSize>) {

  const { permissions: permissionsForSimulation, resourceId: bountyId } = req.body as BountySubmitterPoolCalculation;

  // This is a simulation for inexistent bounty
  if (permissionsForSimulation && !bountyId) {
    const pool = await calculateBountySubmitterPoolSize({
      permissions: permissionsForSimulation as Partial<BountyPermissions>
    });
    return res.status(200).json(pool);

  }

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

  const { error } = await hasAccessToSpace({
    spaceId: bounty.spaceId,
    userId,
    adminOnly: false
  });

  // Allow only space members with grant permissions to run an estimate against space data
  if (permissionsForSimulation && permissions.grant_permissions) {
    const pool = await calculateBountySubmitterPoolSize({
      resourceId: bounty.id,
      permissions: permissionsForSimulation as Partial<BountyPermissions>
    });
    return res.status(200).json(pool);
  }
  // Don't give any actual info to someone without view permission or who is not space member
  else if (!permissions.view || error) {
    const emptyPool: BountySubmitterPoolSize = {
      mode: 'space',
      roleups: [],
      total: 0
    };
    return res.status(200).json(emptyPool);
  }
  // Only allow a space member

  const pool = await calculateBountySubmitterPoolSize({
    resourceId: bounty.id
  });

  return res.status(200).json(pool);
}

export default withSessionRoute(handler);
