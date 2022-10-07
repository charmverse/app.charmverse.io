
import type { Role } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { ApiError, hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  // Delete role performs the check for whether the user can delete it
  .delete(deleteRole)
  .use(requireSpaceMembership({ adminOnly: true }))
  .put(updateRole);

async function deleteRole (req: NextApiRequest, res: NextApiResponse) {
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

  return res.status(200).json({ success: true });
}

async function updateRole (req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body as Role;

  const { id } = req.query;

  if (!id) {
    throw new ApiError({
      message: 'Please provide a valid role id',
      errorType: 'Invalid input'
    });
  }

  // Can't update role that was imported from guild.xyz
  const updatedRole = await prisma.role.updateMany({
    where: {
      id: id as string,
      source: null
    },
    data: {
      name
    }
  });

  return res.status(200).json(updatedRole);
}

export default withSessionRoute(handler);
