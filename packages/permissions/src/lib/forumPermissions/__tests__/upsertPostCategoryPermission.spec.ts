import type { PostCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsUser, testUtilsForum, testUtilsMembers } from '@charmverse/core/test';
import {
  InsecureOperationError,
  InvalidInputError,
  DataNotFoundError,
  UndesirableOperationError
} from '@packages/core/errors';
import { v4 } from 'uuid';

import { AssignmentNotPermittedError } from 'lib/corePermissions';

import { upsertPostCategoryPermission } from '../upsertPostCategoryPermission';

let space: Space;
let user: User;
let postCategory: PostCategory;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  space = generated.space;
  user = generated.user;
  postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
});

describe('upsertPostCategoryPermission', () => {
  it('should create a new post category permission with a role assignee', async () => {
    const role = await testUtilsMembers.generateRole({ createdBy: user.id, spaceId: space.id });
    const permission = await upsertPostCategoryPermission({
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id,
      assignee: { group: 'role', id: role.id }
    });

    expect(permission.permissionLevel).toBe('full_access');
    expect(permission.assignee.group).toBe('role');
    expect(permission.assignee.id).toBe(role.id);
  });

  it('should create a new post category permission with a space assignee', async () => {
    const permission = await upsertPostCategoryPermission({
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id,
      assignee: { group: 'space', id: space.id }
    });

    expect(permission.permissionLevel).toBe('full_access');
    expect(permission.assignee.group).toBe('space');
    expect(permission.assignee.id).toBe(space.id);
  });

  it('should create a new post category permission with a public assignee', async () => {
    const permission = await upsertPostCategoryPermission({
      permissionLevel: 'view',
      postCategoryId: postCategory.id,
      assignee: { group: 'public' }
    });

    expect(permission.permissionLevel).toBe('view');
    expect(permission.assignee.group).toBe('public');
    expect((permission.assignee as any).id).toBeUndefined();
  });

  it('should update an existing permission for the same group', async () => {
    const role = await testUtilsMembers.generateRole({ createdBy: user.id, spaceId: space.id });

    const permission = await upsertPostCategoryPermission({
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id,
      assignee: { group: 'role', id: role.id }
    });

    const afterUpdate = await upsertPostCategoryPermission({
      permissionLevel: 'view',
      postCategoryId: postCategory.id,
      assignee: { group: 'role', id: role.id }
    });

    expect(afterUpdate.permissionLevel).toBe('view');
    expect(afterUpdate.id).toBe(permission.id);
  });

  // Re-add this test when we add support for custom permissions
  // it('should should leave category operation and post operation fields empty when the level is not "custom"', async () => {
  //   const role = await testUtilsMembers.generateRole({ createdBy: user.id, spaceId: space.id });

  //   const permission = await upsertPostCategoryPermission({
  //     permissionLevel: 'full_access',
  //     postCategoryId: postCategory.id,
  //     assignee: { group: 'role', id: role.id }
  //   });

  //   expect(permission.categoryOperations.length).toBe(0);
  //   expect(permission.postOperations.length).toBe(0);
  // });

  it('should fail to create a new post category permission for roles or spaces not matching the current space', async () => {
    const { space: otherSpace, user: otherSpaceUser } = await testUtilsUser.generateUserAndSpace();
    const role = await testUtilsMembers.generateRole({ createdBy: otherSpaceUser.id, spaceId: otherSpace.id });

    await expect(
      upsertPostCategoryPermission({
        permissionLevel: 'full_access',
        postCategoryId: postCategory.id,
        assignee: {
          group: 'role',
          id: role.id
        }
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);

    await expect(
      upsertPostCategoryPermission({
        permissionLevel: 'full_access',
        postCategoryId: postCategory.id,
        assignee: {
          group: 'space',
          id: otherSpace.id
        }
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });

  it('should fail to create a new post category permission if no assignee is provided', async () => {
    await expect(
      upsertPostCategoryPermission({
        permissionLevel: 'full_access',
        postCategoryId: postCategory.id
      } as any)
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should fail to create a new post category permission if the post category does not exist or the ID is invalid', async () => {
    await expect(
      upsertPostCategoryPermission({
        permissionLevel: 'full_access',
        postCategoryId: 'invalid-uuid',
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      upsertPostCategoryPermission({
        permissionLevel: 'full_access',
        postCategoryId: v4(),
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ).rejects.toBeInstanceOf(DataNotFoundError);
  });

  it('should fail to create a new post category permission if permission level is not provided or is invalid', async () => {
    await expect(
      upsertPostCategoryPermission({
        permissionLevel: undefined as any,
        postCategoryId: postCategory.id,
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      upsertPostCategoryPermission({
        permissionLevel: 'abcde' as any,
        postCategoryId: postCategory.id,
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should fail to create a new post category permission for the user assignee', async () => {
    await expect(
      upsertPostCategoryPermission({
        permissionLevel: 'full_access',
        postCategoryId: postCategory.id,
        assignee: {
          group: 'user' as any,
          id: user.id
        }
      })
    ).rejects.toBeInstanceOf(AssignmentNotPermittedError);
  });

  it('should fail to create a new post category permission for the public group if the permission level is other than "guest"', async () => {
    await expect(
      upsertPostCategoryPermission({
        permissionLevel: 'full_access',
        postCategoryId: postCategory.id,
        assignee: {
          group: 'public'
        }
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });

  // Support for custom tiers will be added in the future
  it('should fail to create a new post category permission for the custom tier', async () => {
    await expect(
      upsertPostCategoryPermission({
        permissionLevel: 'custom',
        postCategoryId: postCategory.id,
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ).rejects.toBeInstanceOf(UndesirableOperationError);
  });

  // We do not allow category-level permissions for the category_admin or moderator levels for now. This will be managed as a bulk operation within the space.
  it('should fail to create a new post category permission for the category admin and moderator levels', async () => {
    const role = await testUtilsMembers.generateRole({ createdBy: user.id, spaceId: space.id });

    await expect(
      upsertPostCategoryPermission({
        permissionLevel: 'category_admin',
        postCategoryId: postCategory.id,
        assignee: {
          group: 'role',
          id: role.id
        }
      })
    ).rejects.toBeInstanceOf(UndesirableOperationError);

    await expect(
      upsertPostCategoryPermission({
        permissionLevel: 'moderator',
        postCategoryId: postCategory.id,
        assignee: {
          group: 'role',
          id: role.id
        }
      })
    ).rejects.toBeInstanceOf(UndesirableOperationError);
  });
});
