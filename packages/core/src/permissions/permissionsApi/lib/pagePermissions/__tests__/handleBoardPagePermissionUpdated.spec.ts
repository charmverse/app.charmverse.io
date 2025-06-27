import type { PagePermission } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';

import { handleBoardPagePermissionUpdated } from '../handleBoardPagePermissionUpdated';

describe('handleBoardPagePermissionUpdated', () => {
  it('should always cascade any board permissions to children', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const boardPage = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: user.id,
      type: 'board',
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: {
            group: 'space',
            id: space.id
          }
        }
      ]
    });

    const [card1, card2] = await Promise.all([
      testUtilsPages.generatePage({
        createdBy: user.id,
        spaceId: space.id,
        type: 'card',
        parentId: boardPage.id
      }),
      testUtilsPages.generatePage({
        createdBy: user.id,
        spaceId: space.id,
        type: 'card',
        parentId: boardPage.id
      })
    ]);

    const card1Child = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'page',
      parentId: card1.id
    });

    const boardPermission = await prisma.pagePermission.create({
      data: {
        permissionLevel: 'full_access',
        page: { connect: { id: boardPage.id } },
        user: { connect: { id: user.id } }
      }
    });

    await handleBoardPagePermissionUpdated({ permissionId: boardPermission.id });

    const card = await testUtilsPages.getPageWithPermissions(card1.id);

    expect(card.permissions).toHaveLength(1);

    expect(card.permissions[0]).toMatchObject<PagePermission>({
      id: expect.any(String),
      inheritedFromPermission: boardPermission.id,
      pageId: card1.id,
      permissionLevel: boardPermission.permissionLevel,
      userId: boardPermission.userId,
      permissions: [],
      public: null,
      roleId: null,
      spaceId: null,
      allowDiscovery: false
    });

    const cardChild = await testUtilsPages.getPageWithPermissions(card1Child.id);

    expect(cardChild.permissions).toHaveLength(1);

    expect(cardChild.permissions[0]).toMatchObject<PagePermission>({
      id: expect.any(String),
      inheritedFromPermission: boardPermission.id,
      pageId: cardChild.id,
      permissionLevel: boardPermission.permissionLevel,
      userId: boardPermission.userId,
      permissions: [],
      public: null,
      roleId: null,
      spaceId: null,
      allowDiscovery: false
    });
  });
});
