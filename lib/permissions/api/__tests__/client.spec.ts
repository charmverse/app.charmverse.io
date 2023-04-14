import type { PostPermissionFlags } from '@charmverse/core';
import { PermissionsApiClient, prisma } from '@charmverse/core';

import { AvailablePostPermissions } from 'lib/permissions/forum/availablePostPermissions.class';
import { postPermissionsMapping } from 'lib/permissions/forum/mapping';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

const apiClient = new PermissionsApiClient({
  authKey: 'test',
  baseUrl: 'http://localhost:3000/api'
});

describe('permissions client', () => {
  it('should do something', async () => {
    const { space, user } = await generateUserAndSpace({
      isAdmin: false,
      premiumOptin: true
    });

    const postCategory = await generatePostCategory({
      spaceId: space.id
    });

    const permissions = await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'full_access',
        postCategory: {
          connect: {
            id: postCategory.id
          }
        },
        space: {
          connect: {
            id: space.id
          }
        }
      }
    });

    const post = await generateForumPost({
      spaceId: space.id,
      userId: user.id,
      categoryId: postCategory.id
    });

    const spaceUser = await generateSpaceUser({
      spaceId: space.id
    });

    const result = await apiClient.forum.computePostPermissions({
      resourceId: post.id,
      userId: spaceUser.id
    });

    const testPermissions = new AvailablePostPermissions();

    testPermissions.addPermissions(postPermissionsMapping.full_access);

    expect(result).toMatchObject(expect.objectContaining<PostPermissionFlags>(testPermissions.operationFlags));
  });
});
