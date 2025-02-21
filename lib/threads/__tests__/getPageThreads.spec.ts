import { testUtilsUser } from '@charmverse/core/test';
import { createPage, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { createRole } from '@packages/testing/utils/roles';
import { assignRole } from '@root/lib/roles';

import { createThread } from '../createThread';
import { getPageThreads } from '../getPageThreads';

describe('getPageThreads', () => {
  it(`Should get page threads based on space wide, role and user access`, async () => {
    const { user: adminUser, space } = await generateUserAndSpace({
      isAdmin: true
    });

    const nonRoleUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const roleUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const role = await createRole({
      spaceId: space.id
    });

    await assignRole({
      roleId: role.id,
      userId: roleUser.id
    });

    const page = await createPage({
      createdBy: adminUser.id,
      spaceId: space.id
    });

    const spaceVisibleThread = await createThread({
      comment: 'Comment',
      context: 'Context',
      pageId: page.id,
      userId: adminUser.id
    });

    const roleVisibleThread = await createThread({
      comment: 'Comment',
      context: 'Context',
      pageId: page.id,
      userId: adminUser.id,
      accessGroups: [
        {
          group: 'role',
          id: role.id
        }
      ]
    });

    const userVisibleThread = await createThread({
      comment: 'Comment',
      context: 'Context',
      pageId: page.id,
      userId: adminUser.id,
      accessGroups: [
        {
          group: 'user',
          id: nonRoleUser.id
        }
      ]
    });

    const adminThreads = await getPageThreads({
      pageId: page.id,
      userId: adminUser.id
    });

    const roleUserThreads = await getPageThreads({
      pageId: page.id,
      userId: roleUser.id
    });

    const nonRoleUserThreads = await getPageThreads({
      pageId: page.id,
      userId: nonRoleUser.id
    });

    expect(adminThreads.map((pageThread) => pageThread.id).sort()).toStrictEqual(
      [spaceVisibleThread.id, roleVisibleThread.id, userVisibleThread.id].sort()
    );

    expect(nonRoleUserThreads.map((pageThread) => pageThread.id).sort()).toStrictEqual(
      [spaceVisibleThread.id, userVisibleThread.id].sort()
    );

    expect(roleUserThreads.map((pageThread) => pageThread.id).sort()).toStrictEqual(
      [spaceVisibleThread.id, roleVisibleThread.id].sort()
    );
  });
});
