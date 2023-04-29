import { prisma } from '@charmverse/core';
import type { Space, User } from '@charmverse/core/dist/prisma';
import { expect, test as base } from '@playwright/test';
import { PermissionSettings } from '__e2e__/po/settings/spacePermissionSettings.po';

import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

import { ForumHomePage } from '../po/forumHome.po';
import { ForumPostPage } from '../po/forumPost.po';
import { createUser, createUserAndSpace, generateSpaceRole } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  forumHomePage: ForumHomePage;
  forumPostPage: ForumPostPage;
  permissionSettings: PermissionSettings;
};

const test = base.extend<Fixtures>({
  forumHomePage: ({ page }, use) => use(new ForumHomePage(page)),
  forumPostPage: ({ page }, use) => use(new ForumPostPage(page)),
  permissionSettings: ({ page }, use) => use(new PermissionSettings(page))
});

let adminUser: User;
let moderatorUser: User;
let space: Space;
test.describe.serial('Comment on forum posts', () => {
  test('assign space-wide forum moderators - admin can assign a user as a space-wide forum moderator', async ({
    page,
    forumHomePage,
    permissionSettings
  }) => {
    const generated = await createUserAndSpace({
      browserPage: page,
      permissionConfigurationMode: 'collaborative'
    });

    space = generated.space;
    adminUser = generated.user;
    moderatorUser = await createUser({
      browserPage: page,
      address: randomETHWalletAddress()
    });

    const moderatorSpaceRole = await generateSpaceRole({
      spaceId: space.id,
      userId: moderatorUser.id,
      isAdmin: false
    });

    const moderatorRoleName = 'Forum Moderator';

    // Assign this user as a moderator
    const forumModeratorRole = await prisma.role.create({
      data: {
        space: { connect: { id: space.id } },
        name: moderatorRoleName,
        createdBy: adminUser.id,
        spaceRolesToRole: {
          create: {
            spaceRoleId: moderatorSpaceRole.id
          }
        }
      }
    });

    await login({
      page,
      userId: adminUser.id
    });

    // Start the navigation steps

    await forumHomePage.goToForumHome(space.domain);

    // Open the settings modal

    await permissionSettings.openSettingsModal();

    const spaceSettingsTab = permissionSettings.getSpaceSettingsSectionLocator('space');

    await expect(spaceSettingsTab).toBeVisible();

    // Go to roles section
    await permissionSettings.goToTab('roles');
    await permissionSettings.clickRoleRowByTitle(moderatorRoleName);

    await permissionSettings.goToRowTab(moderatorRoleName, 'permissions');

    // Interact with the form to add a permission, and make sure it's added
    await expect(permissionSettings.spacePermissionsForm).toBeVisible();

    const managePermissionsToggle = permissionSettings.getRoleSpaceOperationSwitchLocator('moderateForums');

    await expect(managePermissionsToggle).toBeVisible();

    await managePermissionsToggle.click();
    const isChecked = await permissionSettings.isOperationChecked('moderateForums');

    expect(isChecked).toBe(true);

    await permissionSettings.submitSpacePermissionSettings();
  });

  // We don't need to test all moderation paths since moderation from post page already handles this
  test('space-wide moderator can delete a comment', async ({ forumPostPage, page }) => {
    const categoryName = 'Example category';

    // A category without any permissions. Nobody can see it apart from moderators
    const category = await generatePostCategory({
      spaceId: space.id,
      name: categoryName
    });

    const postName = 'Example post';

    const post = await generateForumPost({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: category.id,
      title: postName
    });

    const adminCommentText = 'This is a great idea!';

    const adminComment = await prisma.postComment.create({
      data: {
        user: {
          connect: { id: adminUser.id }
        },
        post: { connect: { id: post.id } },
        contentText: adminCommentText,
        content: {
          type: 'doc',
          content: [
            {
              text: adminCommentText,
              type: 'text'
            }
          ]
        }
      }
    });

    await login({
      page,
      userId: moderatorUser.id
    });

    //
    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: post.path
    });
    await forumPostPage.waitForPostLoad({
      domain: space.domain,
      path: post.path
    });
    const contextMenu = forumPostPage.getPostCommentMenuLocator(adminComment.id);

    await expect(contextMenu).toBeVisible();

    await contextMenu.click();

    const deleteOption = forumPostPage.getPostDeleteCommentLocator(adminComment.id);

    await expect(deleteOption).toBeVisible();

    await deleteOption.click();

    const deletedComment = forumPostPage.getDeletedCommentLocator(adminComment.id);

    await expect(deletedComment).toBeVisible();
  });
});
