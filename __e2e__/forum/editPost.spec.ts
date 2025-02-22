import type { Post, Space } from '@charmverse/core/prisma';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { generateForumPost, generatePostCategory } from '@packages/testing/utils/forums';
import { expect, test as base } from '@playwright/test';
import type { LoggedInPage } from '__e2e__/po/loggedIn.po';

import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';

import { ForumPostPage } from '../po/forumPost.po';
import { createUser, createUserAndSpace, generateSpaceRole } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  forumPostPage: ForumPostPage;
  loggedInPage: LoggedInPage;
};

const test = base.extend<Fixtures>({
  forumPostPage: ({ page }, use) => use(new ForumPostPage(page))
});

let space: Space;
let post: Post;

test.describe.serial('Edit a forum post', () => {
  test('editable for the author - navigate to a forum post and be able to edit post if user is the author', async ({
    page,
    forumPostPage
  }) => {
    const generated = await createUserAndSpace({
      browserPage: page,
      permissionConfigurationMode: 'collaborative'
    });

    space = generated.space;

    const memberUser = await createUser({
      browserPage: page,
      address: randomETHWalletAddress()
    });
    await generateSpaceRole({
      spaceId: space.id,
      userId: memberUser.id,
      isAdmin: false
    });
    const categoryName = 'Example category';

    const category = await generatePostCategory({
      spaceId: space.id,
      name: categoryName
    });

    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: category.id
    });

    const postName = 'Example post';

    //
    post = await generateForumPost({
      spaceId: space.id,
      userId: memberUser.id,
      categoryId: category.id,
      title: postName
    });
    await login({
      page,
      userId: memberUser.id
    });

    // Start the navigation steps
    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: post.path
    });

    await forumPostPage.waitForPostLoad({
      domain: space.domain,
      path: post.path
    });

    const isEditable = await forumPostPage.isPostEditable();

    expect(isEditable).toBe(true);
  });

  test('noneditable for the admin - navigate to a forum post and be unable to edit post if user is not the author, even if they are an admin', async ({
    page,
    forumPostPage
  }) => {
    const adminUser = await createUser({
      browserPage: page,
      address: randomETHWalletAddress()
    });

    await generateSpaceRole({
      spaceId: space.id,
      userId: adminUser.id,
      isAdmin: true
    });

    await login({
      page,
      userId: adminUser.id
    });

    // Start the navigation steps

    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: post.path
    });

    await forumPostPage.waitForPostLoad({
      domain: space.domain,
      path: post.path
    });
    const isEditable = await forumPostPage.isPostEditable();

    expect(isEditable).toBe(false);
  });
});
