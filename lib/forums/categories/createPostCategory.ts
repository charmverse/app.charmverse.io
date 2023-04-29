import { prisma } from '@charmverse/core';
import type { PostCategory } from '@charmverse/core/dist/prisma';

import { checkSpacePermissionsEngine, premiumPermissionsApiClient } from 'lib/permissions/api/routers';

import { getPostCategoryPath } from './getPostCategoryPath';

export type CreatePostCategoryInput = Pick<PostCategory, 'name' | 'spaceId'>;
export async function createPostCategory({ name, spaceId }: CreatePostCategoryInput): Promise<PostCategory> {
  const postCategory = await prisma.postCategory.create({
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

  const shouldPopulatePermissions = await checkSpacePermissionsEngine({
    resourceId: postCategory.id,
    resourceIdType: 'postCategory'
  });

  if (shouldPopulatePermissions) {
    await premiumPermissionsApiClient.forum.assignDefaultPostCategoryPermissions({
      resourceId: postCategory.id
    });
  }

  return postCategory;
}
