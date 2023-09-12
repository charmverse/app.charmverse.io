import type { UserSpaceAction } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { createPage, createPost, generateUserAndSpace } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

import { getDefaultPageForSpace } from '../getDefaultPageForSpace';

describe('getDefaultPageForSpace()', () => {
  it('should send user to first top-level page by default', async () => {
    const { space, user } = await generateUserAndSpace();
    const page = await createPage({
      spaceId: space.id,
      createdBy: user.id,
      // add basic permission
      pagePermissions: [{ permissionLevel: 'view', spaceId: space.id }]
    });

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/${page.path}`);
  });

  it('should send user to /members page when no other pages are available', async () => {
    const { space, user } = await generateUserAndSpace();

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/members`);
  });
  it('should send user to last visited static page', async () => {
    const { space, user } = await generateUserAndSpace();
    await savePageView({ createdBy: user.id, spaceId: space.id, pageType: 'forum_posts_list' });

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/forum`);
  });

  it('should send user to last visited document page', async () => {
    const { space, user } = await generateUserAndSpace();
    const page = await createPage({ spaceId: space.id, createdBy: user.id });
    await savePageView({ createdBy: user.id, spaceId: space.id, pageId: page.id, pageType: 'page' });

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/${page.path}`);
  });

  it('should send user to last visited forum post page', async () => {
    const { space, user } = await generateUserAndSpace();
    const category = await generatePostCategory({ spaceId: space.id });
    const post = await createPost({ spaceId: space.id, categoryId: category.id, createdBy: user.id });
    await savePageView({ createdBy: user.id, spaceId: space.id, postId: post.id, pageType: 'post' });

    const url = await getDefaultPageForSpace({ space, userId: user.id });
    expect(url).toEqual(`/${space.domain}/forum?postId=${post.id}`);
  });
});

type EventData = Pick<UserSpaceAction, 'pageType' | 'createdBy' | 'spaceId'> & { pageId?: string; postId?: string };

function savePageView(event: EventData) {
  return prisma.userSpaceAction.create({
    data: {
      action: 'view_page',
      ...event
    }
  });
}
