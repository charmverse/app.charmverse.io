import type { TransactionClient } from '@charmverse/core';
import { prisma } from '@charmverse/core';
import type { PostCategory, Prisma } from '@prisma/client';

import { assignDefaultPostCategoryPermissions } from 'lib/permissions/forum/assignDefaultPostCategoryPermission';

import { getPostCategoryPath } from './getPostCategoryPath';

export type CreatePostCategoryInput = Pick<PostCategory, 'name' | 'spaceId'>;

type CreatePostCategory = CreatePostCategoryInput & {
  tx?: Prisma.TransactionClient;
};

export async function createPostCategory({ name, spaceId, tx }: CreatePostCategory): Promise<PostCategory> {
  if (!tx) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(tx);

  async function txHandler(_tx: TransactionClient) {
    const category = await _tx.postCategory.create({
      data: {
        name,
        path: getPostCategoryPath(name),
        space: {
          connect: {
            id: spaceId
          }
        }
      }
    });

    await assignDefaultPostCategoryPermissions({
      postCategoryId: category.id,
      tx: _tx
    });

    return category;
  }
}
