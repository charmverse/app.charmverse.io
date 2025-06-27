import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { PostCategoryNotFoundError } from '@packages/core/errors';

export type DefaultCategoryAssignment = {
  resourceId: string;
  tx?: Prisma.TransactionClient;
};

export async function assignDefaultPostCategoryPermissions({
  resourceId,
  tx = prisma
}: DefaultCategoryAssignment): Promise<void> {
  const category = await tx.postCategory.findUnique({
    where: {
      id: resourceId
    },
    select: {
      spaceId: true
    }
  });

  if (!category) {
    throw new PostCategoryNotFoundError(resourceId);
  }

  await tx.postCategoryPermission.create({
    data: {
      permissionLevel: 'full_access',
      postCategory: { connect: { id: resourceId } },
      space: { connect: { id: category.spaceId } }
    }
  });
}
