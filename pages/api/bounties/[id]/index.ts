
import { prisma } from 'db';
import { getBounty, UpdateableBountyFields, updateBountySettings } from 'lib/bounties';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { requesterCanDeleteBounty } from 'lib/bounties/shared';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { BountyWithDetails } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc, { NextHandler } from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(getBountyController)
  .put(updateBounty)
  .delete(deleteBounty);

async function getBountyController (req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {
  const { id } = req.query;

  const bounty = await getBounty(id as string);

  const bountyNotFoundError = new DataNotFoundError(`Bounty with id ${id} not found.`);

  if (!bounty) {
    throw bountyNotFoundError;
  }

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: bounty.id,
    userId: req.session.user.id
  });

  if (!permissions.view) {
    throw bountyNotFoundError;
  }

  res.status(200).json(bounty);

}

async function updateBounty (req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {
  const { id } = req.query;

  const body = (req.body ?? {}) as UpdateableBountyFields;

  const bounty = await getBounty(id as string);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${id} was not found`);
  }

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: bounty.id,
    userId
  });

  if (!permissions.edit) {
    throw new UnauthorisedActionError('You do not have permissions to edit this bounty.');
  }

  if (!permissions.grant_permissions) {
    // Don't pass permissions assignment to update operation if user can't grant permissions
    delete body.permissions;
  }

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: bounty.spaceId,
    userId,
    adminOnly: true
  });

  // Only drop keys if user is not an admin
  // Bounty suggestions only exist if creating bounties is disabled at workspace level.
  // In this case, we wouldn't want non admin to configure any other fields than the title and description of the bounty until it is approved.
  // if (bounty.status === 'suggestion' && (error || !isAdmin)) {
  //   typedKeys(body).forEach(key => {
  //     if (key !== 'title' && key !== 'description' && key !== 'descriptionNodes') {
  //       delete body[key];
  //     }
  //   });
  // }

  await updateBountySettings({
    bountyId: id as string,
    updateContent: body
  });

  const rolledUpBounty = await rollupBountyStatus(bounty.id);

  res.status(200).json(rolledUpBounty);

}

async function deleteBounty (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const bounty = await getBounty(id as string);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${id} not found.`);
  }

  const userId = req.session.user.id;

  const { isAdmin } = await hasAccessToSpace({
    spaceId: bounty.spaceId,
    userId,
    adminOnly: false
  });

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: bounty.id,
    userId
  });

  if (!permissions.delete) {
    throw new UnauthorisedActionError('You do not have permissions to delete this bounty.');
  }

  // Permission Filtering Policy: No submissions must exist for a bounty to be deleted by non admin.
  const canDeleteBounty = requesterCanDeleteBounty({
    bounty,
    requesterCreatedBounty: bounty.createdBy === userId,
    requesterIsAdmin: !!isAdmin
  });

  if (!canDeleteBounty) {
    throw new UnauthorisedActionError('You cannot delete this bounty suggestion.');
  }

  await prisma.bounty.delete({
    where: {
      id: id as string
    }
  });

  res.status(200).json({ success: true });

}

export default withSessionRoute(handler);
