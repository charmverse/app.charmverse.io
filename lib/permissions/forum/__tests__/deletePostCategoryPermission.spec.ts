import type { Role, Space, User } from '@prisma/client';

import { prisma } from 'db';
import { UndesirableOperationError } from 'lib/utilities/errors';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

import { deletePostCategoryPermission } from '../deletePostCategoryPermission';

let space: Space;
let adminUser: User;
let role: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: true
  });
  space = generated.space;
  adminUser = generated.user;
  role = await generateRole({
    createdBy: adminUser.id,
    spaceId: space.id
  });
});

describe('deletePostCategoryPermission', () => {
  it('should delete a post category permission', async () => {
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });
    const postCategoryPermission = await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'full_access',
        postCategory: { connect: { id: postCategory.id } },
        role: { connect: { id: role.id } }
      }
    });

    await deletePostCategoryPermission({ permissionId: postCategoryPermission.id });

    await expect(
      prisma.postCategoryPermission.findUnique({ where: { id: postCategoryPermission.id } })
    ).resolves.toEqual(null);
  });

  it('should fail to delete a post category permission if is "category_admin" or "moderator"', async () => {
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });
    const adminPostCategoryPermission = await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'category_admin',
        postCategory: { connect: { id: postCategory.id } },
        role: { connect: { id: role.id } }
      }
    });

    const moderatorPostCategoryPermission = await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'moderator',
        postCategory: { connect: { id: postCategory.id } },
        space: { connect: { id: space.id } }
      }
    });

    await expect(deletePostCategoryPermission({ permissionId: adminPostCategoryPermission.id })).rejects.toBeInstanceOf(
      UndesirableOperationError
    );

    await expect(
      deletePostCategoryPermission({ permissionId: moderatorPostCategoryPermission.id })
    ).rejects.toBeInstanceOf(UndesirableOperationError);
  });
});
