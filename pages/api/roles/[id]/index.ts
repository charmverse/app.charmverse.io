import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ApiError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requirePaidPermissionsSubscription } from 'lib/middleware/requirePaidPermissionsSubscription';
import { updateRole } from 'lib/roles/updateRole';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utils/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requirePaidPermissionsSubscription({
      key: 'id',
      resourceIdType: 'role',
      location: 'query'
    })
  )
  .delete(deleteRole)
  .put(updateRoleController);

async function deleteRole(req: NextApiRequest, res: NextApiResponse) {
  const roleId = req.query.id as string;

  if (!roleId) {
    throw new ApiError({
      message: 'Please provide a valid role id',
      errorType: 'Invalid input'
    });
  }

  const role = await prisma.role.findUnique({
    where: {
      id: roleId
    }
  });

  if (!role) {
    throw new DataNotFoundError(`Could not find role with id ${roleId}`);
  }

  // Check user can delete role
  const { error } = await hasAccessToSpace({
    userId: req.session.user.id,
    spaceId: role.spaceId,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  // Use space ID assertion to prevent role deletion
  await prisma.role.delete({
    where: {
      id: roleId
    }
  });

  trackUserAction('delete_role', {
    userId: req.session.user.id,
    spaceId: role.spaceId
  });

  return res.status(200).end();
}

async function updateRoleController(req: NextApiRequest, res: NextApiResponse) {
  const { id: roleId } = req.query;

  const roleWithSpaceId = await prisma.role.findUnique({
    where: {
      id: roleId as string
    },
    select: {
      spaceId: true
    }
  });

  if (!roleWithSpaceId) {
    throw new DataNotFoundError(`Could not find role with id ${roleId}`);
  }

  const { error } = await hasAccessToSpace({
    spaceId: roleWithSpaceId.spaceId,
    adminOnly: true,
    userId: req.session.user.id
  });

  if (error) {
    throw new UnauthorisedActionError(`You cannot update roles for this space`);
  }

  const updatedRole = await updateRole({
    id: roleId as string,
    update: req.body
  });
  return res.status(200).json(updatedRole);
}

export default withSessionRoute(handler);
