import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { PostCategoryNotFoundError } from 'lib/forums/categories/errors';

type DefaultCategoryAssignment = {
  postCategoryId: string;
  tx?: Prisma.TransactionClient;
};

export async function assignDefaultPostCategoryPermissions({
  postCategoryId,
  tx = prisma
}: DefaultCategoryAssignment): Promise<void> {
  const category = await tx.postCategory.findUnique({
    where: {
      id: postCategoryId
    },
    select: {
      spaceId: true
    }
  });

  if (!category) {
    throw new PostCategoryNotFoundError(postCategoryId);
  }

  await tx.postCategoryPermission.create({
    data: {
      permissionLevel: 'full_access',
      postCategory: { connect: { id: postCategoryId } },
      space: { connect: { id: category.spaceId } }
    }
  });
}
