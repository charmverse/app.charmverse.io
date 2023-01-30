import { prisma } from 'db';
import { findOrCreateRoles } from 'lib/roles/createRoles';
import type { ExternalRole } from 'lib/roles/interfaces';

export async function createAndAssignRoles({
  userId,
  spaceId,
  roles
}: {
  userId: string;
  spaceId: string;
  roles: ExternalRole[];
}) {
  if (!roles.length) {
    return;
  }
  const spaceMembership = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  if (!spaceMembership) {
    return;
  }

  const rolesRecord = await findOrCreateRoles(roles, spaceId, userId, {
    source: 'collabland',
    createRoles: true
  });

  const roleIdsToAssign: string[] = [];
  roles.forEach((externalRole) => {
    const role = rolesRecord[externalRole.id];
    if (role) {
      roleIdsToAssign.push(role.id);
    }
  });

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
}
