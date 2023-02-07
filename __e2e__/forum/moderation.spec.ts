import { expect, test as base } from '@playwright/test';
import type { Post, Space, User } from '@prisma/client';
import { ForumPostPage } from '__e2e__/po/forumPost.po';
import { createUserAndSpace, createUser, generateSpaceRole } from '__e2e__/utils/mocks';

import { prisma } from 'db';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { generatePostCategory, generateForumPost } from 'testing/utils/forums';

import { login } from '../utils/session';

type Fixtures = {
  forumPostPage: ForumPostPage;
};

const test = base.extend<Fixtures>({
  forumPostPage: ({ page }, use) => use(new ForumPostPage(page))
});

let moderatorUser: User;
let memberUser: User;
let authorUser: User;
let space: Space;
let post: Post;

test.describe.serial('Moderate forum posts', () => {
  test('delete an unwanted comment', async ({ forumPostPage, page }) => {
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

    const category = await generatePostCategory({
      spaceId: space.id,
      name: categoryName
    });

    // Allow the entire space to create posts and participate in this category
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: category.id
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
        postCategory: { connect: { id: category.id } },
        role: { connect: { id: moderationRole.id } }
      }
    });

    const postName = 'Example post';

    post = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: category.id,
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
  });
});
