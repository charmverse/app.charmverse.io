import { prisma } from 'db';

export async function assignRolesToSpaceRole({ roleIds, spaceRoleId }: { roleIds: string[]; spaceRoleId: string }) {
  return prisma.$transaction(
    roleIds.map((roleId) => {
      return prisma.spaceRoleToRole.upsert({
        where: {
          spaceRoleId_roleId: {
            spaceRoleId,
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
              id: spaceRoleId
            }
          }
        },
        // Perform an empty update
        update: {}
      });
    })
  );
}
