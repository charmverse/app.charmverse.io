// @ts-nocheck
import { ProposalCategoryPermissionLevel, SpacePermission, prisma } from '@charmverse/core/prisma-client';
import { paginatedPrismaTask } from 'lib/utils/paginatedPrismaTask';

const permissionsAllowingCreate: ProposalCategoryPermissionLevel[] = ['full_access', 'create_comment'];

async function addSpaceCreateProposals() {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      spacePermissions: true,
      proposalCategories: {
        select: {
          id: true,
          proposalCategoryPermissions: true
        }
      }
    }
  });

  for (const space of spaces) {
    const spaceWidePermissions = space.spacePermissions.find((p) => !!p.spaceId) as SpacePermission;

    const spaceProposalCategoryPermissions = space.proposalCategories
      .flatMap((category) => category.proposalCategoryPermissions)
      .flat();

    const spaceHasCategoryWithCreatePermission = spaceProposalCategoryPermissions.some(
      (permission) => permission.spaceId && permissionsAllowingCreate.includes(permission.permissionLevel)
    );

    const roleIdsWithCreatePermission = spaceProposalCategoryPermissions
      .filter((permission) => !!permission.roleId && permissionsAllowingCreate.includes(permission.permissionLevel))
      .map((permission) => permission.roleId as string);

    await prisma.$transaction(async (tx) => {
      if (spaceHasCategoryWithCreatePermission && !spaceWidePermissions.operations.includes('createProposals')) {
        await tx.spacePermission.update({
          where: {
            id: spaceWidePermissions.id
          },
          data: {
            operations: [...spaceWidePermissions.operations, 'createProposals']
          }
        });
      }

      for (const roleId of roleIdsWithCreatePermission) {
        const roleSpacePermission = space.spacePermissions.find((permission) => permission.roleId === roleId);
        if (!roleSpacePermission?.operations.includes('createProposals')) {
          await tx.spacePermission.upsert({
            where: {
              roleId_forSpaceId: {
                forSpaceId: space.id,
                roleId
              }
            },
            create: {
              forSpace: { connect: { id: space.id } },
              role: { connect: { id: roleId } },
              operations: [...spaceWidePermissions.operations, 'createProposals']
            },
            update: {
              operations: {
                push: 'createProposals'
              }
            }
          });
        }
      }
    });
  }
}
