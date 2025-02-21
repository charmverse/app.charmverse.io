import type { PostPermissionFlags } from '@charmverse/core/permissions';
import { AvailablePostPermissions } from '@charmverse/core/permissions';
import type { Space, User } from '@charmverse/core/prisma';
import { PostOperation } from '@charmverse/core/prisma';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';
import { objectUtils } from '@charmverse/core/utilities';
import { InvalidInputError } from '@packages/utils/errors';
import { PostNotFoundError } from '@root/lib/forums/posts/errors';
import { v4 } from 'uuid';

import { baseComputePostPermissions, computePostPermissions } from '../computePostPermissions';

const postOperations = objectUtils.typedKeys(PostOperation);
const postOperationsWithoutEdit = postOperations.filter((op) => op !== 'edit_post');

let adminUser: User;
let spaceMemberUser: User;
let authorUser: User;
let space: Space;

let otherSpace: Space;
let otherSpaceAdminUser: User;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  authorUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;
});

// We don't configure permissions in public mode, so these are the default permissions we expect
const memberOperations: PostOperation[] = ['view_post', 'upvote', 'downvote', 'add_comment'];

describe('computePostPermissions - base', () => {
  // This test exists so we can apply a certain permission level to the space, but make it higher or lower for a user
  it('should provide full permissions to the admin', async () => {
    // Perform the test with a page that has user / role / space / permissions ----------------------------
    const postCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id
    });

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: adminUser.id
    });

    expect(permissions).toMatchObject(
      expect.objectContaining({
        ...new AvailablePostPermissions().full
      })
    );
  });

  it('should provide full permissions to space members', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });
    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: spaceMemberUser.id
    });

    expect(permissions).toMatchObject<PostPermissionFlags>({
      // All space members can engage with the post
      view_post: true,
      add_comment: true,
      downvote: true,
      upvote: true,
      // Moderator-type permissions are provided to all members
      delete_comments: true,
      delete_post: true,
      lock_post: true,
      pin_post: true,
      // Only author gets an edit_post permission
      edit_post: false
    });
  });

  it('should always allow the author to view, edit and delete the post', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });
    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: authorUser.id
    });

    expect(permissions).toMatchObject<PostPermissionFlags>({
      // All space members can engage with the post
      view_post: true,
      add_comment: true,
      downvote: true,
      upvote: true,
      // Moderator-type permissions are provided to all members
      delete_comments: true,
      delete_post: true,
      lock_post: true,
      pin_post: true,
      // Only author gets an edit_post permission
      edit_post: true
    });
  });

  it('should allow people from outside the space to view the post', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    const [publicPermissions, outsideUserPermissions] = await Promise.all([
      baseComputePostPermissions({
        resourceId: post.id,
        userId: undefined
      }),
      baseComputePostPermissions({
        resourceId: post.id,
        userId: otherSpaceAdminUser.id
      })
    ]);

    expect(publicPermissions).toMatchObject(
      expect.objectContaining<PostPermissionFlags>({
        ...new AvailablePostPermissions().empty,
        view_post: true
      })
    );

    expect(outsideUserPermissions).toMatchObject(
      expect.objectContaining<PostPermissionFlags>({
        ...new AvailablePostPermissions().empty,
        view_post: true
      })
    );
  });

  it('should throw an error if the post does not exist or postId is invalid', async () => {
    await expect(
      baseComputePostPermissions({
        resourceId: v4(),
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(PostNotFoundError);

    await expect(
      baseComputePostPermissions({
        resourceId: null as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      baseComputePostPermissions({
        resourceId: 'text' as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});

describe('computePostPermissions - with editable by author policy', () => {
  it('should only allow a author to edit their post', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });
    const adminPermissions = await computePostPermissions({
      resourceId: post.id,
      userId: adminUser.id
    });
    postOperationsWithoutEdit.forEach((op) => {
      expect(adminPermissions[op]).toBe(true);
    });
    expect(adminPermissions.edit_post).toBe(false);

    const authorPermissions = await computePostPermissions({
      resourceId: post.id,
      userId: authorUser.id
    });

    expect(authorPermissions.edit_post).toBe(true);
  });
});

describe('computePostPermissions - with draft post permission filtering policy', () => {
  it('should enable view_post and delete_post only for drafted post author', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id,
      isDraft: true
    });

    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: authorUser.id
    });

    postOperationsWithoutEdit.forEach((op) => {
      if (op === 'view_post' || op === 'delete_post' || op === 'edit_post') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should disable all permissions of drafted post for admin', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id,
      isDraft: true
    });

    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: adminUser.id
    });

    postOperationsWithoutEdit.forEach((op) => {
      expect(permissions[op]).toBe(false);
    });
  });
});
