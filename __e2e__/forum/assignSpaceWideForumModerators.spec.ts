import { expect, test as base } from '@playwright/test';
import type { Post, PostComment, Space, User } from '@prisma/client';
import { SpaceSettings } from '__e2e__/po/spaceSettings.po';

import { prisma } from 'db';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
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
};

const test = base.extend<Fixtures>({
  forumHomePage: ({ page }, use) => use(new ForumHomePage(page)),
  forumPostPage: ({ page }, use) => use(new ForumPostPage(page)),
  spaceSettingsPage: ({ page }, use) => use(new SpaceSettings(page))
});

let adminUser: User;
let moderatorUser: User;
let space: Space;
let post: Post;
let adminComment: PostComment;

test.describe.serial('Comment on forum posts', () => {
  test('assign space-wide forum moderators - admin can assign a user as a space-wide forum moderator', async ({
    page,
    forumHomePage,
    forumPostPage,
    spaceSettingsPage
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
    await prisma.role.create({
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

    const categoryName = 'Example category';

    // A category without any permissions. Nobody can see it apart from moderators
    const category = await generatePostCategory({
      spaceId: space.id,
      name: categoryName
    });

    const postName = 'Example post';

    post = await generateForumPost({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: category.id,
      title: postName
    });

    const adminCommentText = 'This is a great idea!';

    adminComment = await prisma.postComment.create({
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
      userId: adminUser.id
    });

    // Start the navigation steps

    await forumHomePage.goToForumHome(space.domain);

    await page.pause();

    await spaceSettingsPage.openSettingsModal();

    const spaceSettingsTab = spaceSettingsPage.getSpaceSettingsLocator(space.id);

    await expect(spaceSettingsTab).toBeVisible();

    const rolesTab = spaceSettingsPage.getSpaceSettingsSectionLocator({ spaceId: space.id, section: 'roles' });

    await expect(rolesTab).toBeVisible();

    // --------------------- END TEST ---------------------

    await page.pause();
  });

  // test('space-wide moderator can delete a comment', async ({ forumPostPage, page }) => {
  //   await login({
  //     page,
  //     userId: moderatorUser.id
  //   });

  //   await forumPostPage.goToPostPage({
  //     domain: space.domain,
  //     path: post.path
  //   });
  // });
});
