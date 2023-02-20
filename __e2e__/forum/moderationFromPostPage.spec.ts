import { expect, test as base } from '@playwright/test';
import type { Post, PostCategory, Space, User } from '@prisma/client';
import { ForumHomePage } from '__e2e__/po/forumHome.po';
import { ForumPostPage } from '__e2e__/po/forumPost.po';
import { PageHeader } from '__e2e__/po/pageHeader.po';
import { createUserAndSpace, createUser, generateSpaceRole } from '__e2e__/utils/mocks';

import { prisma } from 'db';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { generatePostCategory, generateForumPost } from 'testing/utils/forums';

import { login } from '../utils/session';

type Fixtures = {
  pageHeader: PageHeader;
  forumPostPage: ForumPostPage;
  forumHomePage: ForumHomePage;
};

const test = base.extend<Fixtures>({
  forumPostPage: ({ page }, use) => use(new ForumPostPage(page)),
  forumHomePage: ({ page }, use) => use(new ForumHomePage(page)),
  pageHeader: ({ page }, use) => use(new PageHeader(page))
});

let moderatorUser: User;
let memberUser: User;
let authorUser: User;
let space: Space;
let post: Post;
let postCategory: PostCategory;

test.describe.serial('Moderate forum posts', () => {
  test('moderator can delete an unwanted comment', async ({ forumPostPage, page }) => {
    // Setup test environment
    const generated = await createUserAndSpace({
      browserPage: page,
      permissionConfigurationMode: 'collaborative'
    });

    space = generated.space;

    memberUser = await createUser({
      browserPage: page,
      address: randomETHWalletAddress()
    });

    authorUser = await createUser({
      browserPage: page,
      address: randomETHWalletAddress()
    });

    moderatorUser = await createUser({
      browserPage: page,
      address: randomETHWalletAddress()
    });

    await generateSpaceRole({
      spaceId: space.id,
      userId: memberUser.id,
      isAdmin: false
    });

    await generateSpaceRole({
      spaceId: space.id,
      userId: authorUser.id,
      isAdmin: false
    });

    const moderatorSpaceRole = await generateSpaceRole({
      spaceId: space.id,
      userId: moderatorUser.id,
      isAdmin: false
    });

    const categoryName = 'Example category';

    postCategory = await generatePostCategory({
      spaceId: space.id,
      name: categoryName
    });

    // Allow the entire space to create posts and participate in this category
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    // Create a moderation role and assign it to the moderator
    const moderationRole = await prisma.role.create({
      data: {
        space: { connect: { id: space.id } },
        name: 'Forum Moderator',
        // Usually this would be created by an admin, but we're not using one in this test
        createdBy: moderatorUser.id,
        spaceRolesToRole: {
          create: {
            spaceRoleId: moderatorSpaceRole.id
          }
        }
      }
    });

    // Allow the moderation role to moderate posts in this category
    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'moderator',
        postCategory: { connect: { id: postCategory.id } },
        role: { connect: { id: moderationRole.id } }
      }
    });

    const postName = 'Example post';

    post = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id,
      title: postName
    });

    const commenttext = 'This is a great idea!';

    const unwantedcomment = await prisma.postComment.create({
      data: {
        user: {
          connect: { id: memberUser.id }
        },
        post: { connect: { id: post.id } },
        contentText: commenttext,
        content: {
          type: 'doc',
          content: [
            {
              text: commenttext,
              type: 'text'
            }
          ]
        }
      }
    });

    // Start the real test ------------------
    await login({ page, userId: moderatorUser.id });

    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: post.path
    });

    await forumPostPage.waitForPostLoad({
      domain: space.domain,
      path: post.path
    });
    const contextMenu = forumPostPage.getPostCommentMenuLocator(unwantedcomment.id);

    await expect(contextMenu).toBeVisible();

    await contextMenu.click();

    const deleteOption = forumPostPage.getPostDeleteCommentLocator(unwantedcomment.id);

    await expect(deleteOption).toBeVisible();

    await deleteOption.click();

    const deletedComment = forumPostPage.getDeletedCommentLocator(unwantedcomment.id);

    await expect(deletedComment).toBeVisible();
  });
  test('moderator can delete an unwanted post from the full view post page', async ({
    forumPostPage,
    forumHomePage,
    page,
    pageHeader
  }) => {
    const postToDelete = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id
    });
    await login({ page, userId: moderatorUser.id });
    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: postToDelete.path
    });
    const header = pageHeader.pageTopLevelMenu;
    await expect(header).toBeVisible();
    await header.click();
    const forumPostActions = pageHeader.forumPostActions;
    await expect(forumPostActions).toBeVisible();
    const deleteOption = pageHeader.deleteCurrentPage;
    await expect(deleteOption).toBeVisible();
    await deleteOption.click();
    // After deleting, user should be redirected to the forum home page
    await forumHomePage.waitForForumHome(space.domain);
  });

  test('author can delete their own post from the full view post page', async ({
    forumPostPage,
    forumHomePage,
    page,
    pageHeader
  }) => {
    const postToDelete = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id
    });
    await login({ page, userId: authorUser.id });
    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: postToDelete.path
    });
    const header = pageHeader.pageTopLevelMenu;
    await expect(header).toBeVisible();
    await header.click();
    const forumPostActions = pageHeader.forumPostActions;
    await expect(forumPostActions).toBeVisible();
    const deleteOption = pageHeader.deleteCurrentPage;
    await expect(deleteOption).toBeVisible();
    await deleteOption.click();
    // After deleting, user should be redirected to the forum home page
    await forumHomePage.waitForForumHome(space.domain);
  });

  test('normal member sees a disabled delete post button', async ({ forumPostPage, page, pageHeader }) => {
    const postToDelete = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id
    });

    await login({ page, userId: memberUser.id });

    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: postToDelete.path
    });

    const header = pageHeader.pageTopLevelMenu;

    await expect(header).toBeVisible();

    await header.click();

    const forumPostActions = pageHeader.forumPostActions;
    await expect(forumPostActions).toBeVisible();

    const deleteOption = pageHeader.deleteCurrentPage;
    await expect(deleteOption).toBeVisible();

    // The mui lib renders this element as a div with a disabled css class, but no prop. We can check for the aria-disabled attribute instead as a workaround
    const isDisabled = await deleteOption.getAttribute('aria-disabled');

    expect(isDisabled).toBe('true');
  });
});
