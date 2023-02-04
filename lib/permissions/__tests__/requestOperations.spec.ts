import type { Space, User } from '@prisma/client';

import { ActionNotPermittedError } from 'lib/middleware';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

import { AvailablePostPermissions } from '../forum/availablePostPermissions.class';
import { postOperations } from '../forum/interfaces';
import { upsertPostCategoryPermission } from '../forum/upsertPostCategoryPermission';
import { upsertPermission } from '../pages';
import { requestOperations } from '../requestOperations';

let adminUser: User;
let spaceMemberUser: User;
let authorUser: User;
let space: Space;

let otherSpace: Space;
let otherSpaceAdminUser: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  authorUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;
});

afterAll(() => {
  jest.resetModules();
});

describe('requestOperations', () => {
  it('should return true if the user has the requested permissions for a post', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });

    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    const post = await generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    const result = await requestOperations({
      resourceId: post.id,
      userId: spaceMemberUser.id,
      resourceType: 'post',
      operations: ['upvote', 'downvote']
    });

    expect(result).toBe(true);
  });

  it('should return true if the user has the requested permissions for a post category', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    const result = await requestOperations({
      resourceId: postCategory.id,
      userId: spaceMemberUser.id,
      resourceType: 'post_category',
      operations: ['create_post']
    });

    expect(result).toBe(true);
  });

  it('should throw an ActionNotPermitted error if the user does not have the requested permissions for a resource', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    await expect(
      requestOperations({
        resourceId: postCategory.id,
        userId: spaceMemberUser.id,
        resourceType: 'post_category',
        operations: ['manage_permissions']
      })
    ).rejects.toBeInstanceOf(ActionNotPermittedError);
  });
});
