
import type { SpaceRole, SpaceRoleToRole } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { hasAccessToSpace, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import type { RoleAssignment, RoleWithMembers } from 'lib/roles';
import { assignRole, unassignRole } from 'lib/roles';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys<SpaceRoleToRole & SpaceRole>(['roleId', 'userId'], 'body'))
  .post(assignRoleController)
  .delete(unassignRoleController);

async function unassignRoleController (req: NextApiRequest, res: NextApiResponse<RoleWithMembers>) {
  const { roleId, userId } = req.body as RoleAssignment;

  const { id: requestingUserId } = req.session.user;

  const roleSpaceId = await prisma.role.findUnique({
    where: {
      id: roleId
    },
    select: {
      spaceId: true
    }
  });

  if (!roleSpaceId) {
    throw new DataNotFoundError(`Role with id ${roleId} not found`);
  }

  const { error } = await hasAccessToSpace({
    spaceId: roleSpaceId.spaceId,
    userId: requestingUserId,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  const roleAfterUpdate = await unassignRole({
    roleId,
    userId
  });

  return res.status(200).json(roleAfterUpdate);
}

async function assignRoleController (req: NextApiRequest, res: NextApiResponse<RoleWithMembers>) {
  const { roleId, userId } = req.body as RoleAssignment;

  const { id: requestingUserId } = req.session.user;

  const roleSpaceId = await prisma.role.findUnique({
    where: {
      id: roleId
    },
    select: {
      spaceId: true
    }
  });

  if (!roleSpaceId) {
    throw new DataNotFoundError(`Role with id ${roleId} not found`);
  }

  const { error } = await hasAccessToSpace({
    spaceId: roleSpaceId.spaceId,
    userId: requestingUserId,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  const roleAfterUpdate = await assignRole({
    roleId,
    userId
  });

  return res.status(201).json(roleAfterUpdate);

}

export default withSessionRoute(handler);
