import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BountyWithDetails, UpdateableBountyFields } from 'lib/bounties';
import { getBounty, updateBountySettings } from 'lib/bounties';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'bounty'
    })
  )
  .get(getBountyController)
  .put(updateBounty);

async function getBountyController(req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {
  const { id } = req.query;

  const bounty = await getBounty(id as string);

  if (!bounty || !bounty.page) {
    throw new DataNotFoundError(`Bounty with id ${id} not found.`);
  }

  const pageId = bounty.page.id;

  const permissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageId,
    userId: req.session.user?.id
  });

  if (!permissions.read) {
    throw new UnauthorisedActionError('You do not have permissions to view this bounty.');
  }

  res.status(200).json(bounty);
}

async function updateBounty(req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {
  const { id } = req.query;

  const body = (req.body ?? {}) as UpdateableBountyFields;

  const bounty = await getBounty(id as string);

  if (!bounty || !bounty.page) {
    throw new DataNotFoundError(`Bounty with id ${id} was not found`);
  }

  const userId = req.session.user.id;

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: bounty.spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw new UnauthorisedActionError('You do not have permissions to edit this bounty.');
  }

  const bountyPagePermissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: bounty.page.id,
    userId
  });

  if (bountyPagePermissions.edit_content !== true) {
    throw new UnauthorisedActionError('You do not have permissions to edit this bounty.');
  }

  // Only drop keys if user is not an admin
  // Bounty suggestions only exist if creating bounties is disabled at workspace level.
  // In this case, we wouldn't want non admin to configure any other fields than the title and description of the bounty until it is approved.
  if (bounty.status === 'suggestion') {
    // Non admins can only update their own suggestions
    if (bounty.createdBy !== userId && !isAdmin) {
      throw new UnauthorisedActionError('You do not have permissions to edit this bounty.');
    }
  }

  await updateBountySettings({
    bountyId: id as string,
    updateContent: body
  });

  const rolledUpBounty = await rollupBountyStatus({
    bountyId: bounty.id,
    userId
  });

  res.status(200).json(rolledUpBounty);
}

export default withSessionRoute(handler);
