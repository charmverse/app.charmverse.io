import type { SpaceRole, SpaceRoleToRole } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import type { RoleAssignment, RoleWithMembers } from 'lib/roles';
import { assignRole, unassignRole } from 'lib/roles';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<SpaceRoleToRole & SpaceRole>(['roleId', 'userId'], 'body'))
  .post(assignRoleController)
  .delete(unassignRoleController);

async function unassignRoleController(req: NextApiRequest, res: NextApiResponse<RoleWithMembers>) {
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

  await unassignRole({
    roleId,
    userId
  });

  trackUserAction('unassign_member_role', {
    spaceId: roleSpaceId.spaceId,
    userId: requestingUserId
  });

  return res.status(200).end();
}

async function assignRoleController(req: NextApiRequest, res: NextApiResponse<RoleWithMembers>) {
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

  await assignRole({
    roleId,
    userId
  });

  trackUserAction('assign_member_role', {
    spaceId: roleSpaceId.spaceId,
    userId: requestingUserId
  });

  return res.status(201).end();
}

export default withSessionRoute(handler);
