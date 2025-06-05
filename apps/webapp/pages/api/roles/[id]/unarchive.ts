import { prisma } from '@charmverse/core/prisma-client';
import { defaultHandler } from '@packages/lib/middleware/handler';
import { isSpaceAdmin } from '@packages/lib/permissions/isSpaceAdmin';
import { unarchiveRole } from '@packages/lib/roles/unarchiveRole';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ApiError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = defaultHandler();

handler.put(unarchiveRoleController);

async function unarchiveRoleController(req: NextApiRequest, res: NextApiResponse) {
  const roleId = req.query.id as string;
  const role = await prisma.role.findUniqueOrThrow({
    where: {
      id: roleId
    },
    select: {
      spaceId: true
    }
  });

  const spaceAdmin = await isSpaceAdmin({ spaceId: role.spaceId, userId: req.session.user.id });

  if (!spaceAdmin) {
    throw new ApiError({
      message: 'You are not authorized to unarchive this role',
      errorType: 'Access denied'
    });
  }

  const updatedRole = await unarchiveRole({
    roleId,
    userId: req.session.user.id
  });

  return res.status(200).json(updatedRole);
}

export default withSessionRoute(handler);
