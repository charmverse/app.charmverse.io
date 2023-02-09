import { expect, test as base } from '@playwright/test';
import type { Space, User } from '@prisma/client';
import { LoggedInPage } from '__e2e__/po/loggedIn.po';
import { SpaceSettings } from '__e2e__/po/spaceSettings.po';
import { SpaceSettingsTabRoles } from '__e2e__/po/spaceSettingsTabRoles.po';

import { prisma } from 'db';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

import { ForumHomePage } from '../po/forumHome.po';
import { ForumPostPage } from '../po/forumPost.po';
import { createUser, createUserAndSpace, generateSpaceRole } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  forumHomePage: ForumHomePage;
  forumPostPage: ForumPostPage;
  spaceSettingsPage: SpaceSettings;
  spaceSettingsTabRoles: SpaceSettingsTabRoles;
  loggedInPage: LoggedInPage;
};

const test = base.extend<Fixtures>({
  forumHomePage: ({ page }, use) => use(new ForumHomePage(page)),
  forumPostPage: ({ page }, use) => use(new ForumPostPage(page)),
  spaceSettingsPage: ({ page }, use) => use(new SpaceSettings(page)),
  spaceSettingsTabRoles: ({ page }, use) => use(new SpaceSettingsTabRoles(page)),
  loggedInPage: ({ page }, use) => use(new LoggedInPage(page))
});

let adminUser: User;
let moderatorUser: User;
let space: Space;
test.describe.serial('Comment on forum posts', () => {
  test('assign space-wide forum moderators - admin can assign a user as a space-wide forum moderator', async ({
    page,
    forumHomePage,
    forumPostPage,
    spaceSettingsPage,
    spaceSettingsTabRoles,
    loggedInPage
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

    await spaceSettingsPage.openSettingsModal();

    const spaceSettingsTab = spaceSettingsPage.getSpaceSettingsLocator(space.id);

    await expect(spaceSettingsTab).toBeVisible();

    // Go to roles section
    const rolesTab = spaceSettingsPage.getSpaceSettingsSectionLocator({ spaceId: space.id, section: 'roles' });

    await expect(rolesTab).toBeVisible();

    await rolesTab.click();

    // Make sure list of roles shows
    const roleToUpdateContextMenu = spaceSettingsTabRoles.getExpandRoleContextMenuLocator(forumModeratorRole.id);

    await expect(roleToUpdateContextMenu).toBeVisible();

    // Open context menu and access the space-permissions modal for the role

    await roleToUpdateContextMenu.click();

    const openManageRoleSpacePermissionsModal = spaceSettingsTabRoles.getOpenManageRoleSpacePermissionsModalLocator(
      forumModeratorRole.id
    );

    await expect(openManageRoleSpacePermissionsModal).toBeVisible();

    await openManageRoleSpacePermissionsModal.click();

    // Interact with the form to add a permission, and make sure it's added
    await expect(spaceSettingsTabRoles.spacePermissionsForm).toBeVisible();

    const managePermissionsToggle = spaceSettingsTabRoles.getRoleSpaceOperationSwitchLocator('moderate_forums');

    await expect(managePermissionsToggle).toBeVisible();

    await managePermissionsToggle.click();
    const isChecked = await spaceSettingsTabRoles.isOperationChecked('moderate_forums');

    expect(isChecked).toBe(true);

    const newRolePermissions = await spaceSettingsTabRoles.submitSpacePermissionSettings();

    expect(newRolePermissions.moderate_forums).toBe(true);
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
