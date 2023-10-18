import type { RoleSource } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { findOrCreateRoles } from 'lib/roles/createRoles';
import type { ExternalRole } from 'lib/roles/interfaces';
import { isTruthy } from 'lib/utilities/types';

export async function createAndAssignRoles({
  userId,
  spaceId,
  roles,
  source = 'collabland',
  createRoles = true
}: {
  userId: string;
  spaceId: string;
  roles: ExternalRole[];
  source?: RoleSource | null;
  createRoles?: boolean;
}) {
  if (!roles.length) {
    return null;
  }
  const spaceMembership = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  if (!spaceMembership) {
    return null;
  }

  const rolesRecord = await findOrCreateRoles(roles, spaceId, userId, {
    source,
    createRoles
  });

  const roleIdsToAssign: string[] = Object.values(rolesRecord)
    .filter(isTruthy)
    .map((role) => role.id);

  await prisma.$transaction(
    roleIdsToAssign.map((roleId) => {
      // assign roles to user
      return prisma.spaceRoleToRole.upsert({
        where: {
          spaceRoleId_roleId: {
            spaceRoleId: spaceMembership.id,
            roleId
          }
        },
        create: {
          role: {
            connect: {
              id: roleId
            }
          },
          spaceRole: {
            connect: {
              id: spaceMembership.id
            }
          }
        },
        // Perform an empty update if user already has the role
        update: {}
      });
    })
  );

  return rolesRecord;
}
