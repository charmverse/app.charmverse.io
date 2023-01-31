import type { Role, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { PostCategoryNotFoundError } from 'lib/forums/categories/errors';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

import { listPostCategoryPermissions } from '../listPostCategoryPermissions';
import { upsertPostCategoryPermission } from '../upsertPostCategoryPermission';

let space: Space;
let user: User;
let role: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: false
  });
  space = generated.space;
  user = generated.user;
  role = await generateRole({
    createdBy: user.id,
    spaceId: space.id,
    assigneeUserIds: [user.id]
  });
});
describe('listPostCategoryPermissions', () => {
  it('should return all assigned permissions for space members', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });
    const permissions = await Promise.all([
      upsertPostCategoryPermission({
        assignee: { group: 'role', id: role.id },
        permissionLevel: 'member',
        postCategoryId: postCategory.id
      }),
      upsertPostCategoryPermission({
        assignee: { group: 'space', id: space.id },
        permissionLevel: 'guest',
        postCategoryId: postCategory.id
      }),
      upsertPostCategoryPermission({
        assignee: { group: 'public' },
        permissionLevel: 'guest',
        postCategoryId: postCategory.id
      })
    ]);

    const foundPermissions = await listPostCategoryPermissions({
      resourceId: postCategory.id,
      userId: user.id
    });

    expect(foundPermissions.length).toBe(permissions.length);
    foundPermissions.forEach((foundPermission) => {
      expect(permissions).toContainEqual(expect.objectContaining(foundPermission));
    });
  });

  it('should return an empty list for non-space members', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });
    await Promise.all([
      upsertPostCategoryPermission({
        assignee: { group: 'role', id: role.id },
        permissionLevel: 'member',
        postCategoryId: postCategory.id
      }),
      upsertPostCategoryPermission({
        assignee: { group: 'space', id: space.id },
        permissionLevel: 'guest',
        postCategoryId: postCategory.id
      }),
      upsertPostCategoryPermission({
        assignee: { group: 'public' },
        permissionLevel: 'guest',
        postCategoryId: postCategory.id
      })
    ]);

    const { user: otherSpaceUser } = await generateUserAndSpace({
      isAdmin: true
    });

    const foundPermissions = await listPostCategoryPermissions({
      resourceId: postCategory.id,
      userId: otherSpaceUser.id
    });

    expect(foundPermissions.length).toBe(0);

    const foundPublicPermissions = await listPostCategoryPermissions({
      resourceId: postCategory.id,
      userId: undefined
    });

    expect(foundPublicPermissions.length).toBe(0);
  });

  it('should throw an error if the post category does not exist or the ID is invalid', async () => {
    await expect(
      listPostCategoryPermissions({
        resourceId: 'invalid-post-category',
        userId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      listPostCategoryPermissions({
        resourceId: undefined as any,
        userId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      listPostCategoryPermissions({
        resourceId: v4(),
        userId: user.id
      })
    ).rejects.toBeInstanceOf(PostCategoryNotFoundError);
  });
});
