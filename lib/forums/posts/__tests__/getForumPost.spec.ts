import type { Post, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { PageNotFoundError } from 'lib/pages/server';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateForumPost } from 'testing/utils/forums';

import { getForumPost } from '../getForumPost';
import type { ForumPostPage } from '../interfaces';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('getForumPost', () => {
  it('should return the page and attached post', async () => {
    const createdPage = await generateForumPost({
      userId: user.id,
      spaceId: space.id
    });

    const retrievedPost = await getForumPost({ pageId: createdPage.id, userId: '' });

    expect(retrievedPost).toMatchObject(
      expect.objectContaining<Partial<ForumPostPage>>({
        id: expect.any(String),
        content: expect.any(Object),
        post: expect.objectContaining<Partial<Post>>({
          locked: false,
          pinned: false
        })
      })
    );
  });

  it('should return null if the page does not have the type "post", or it does not exist', async () => {
    const page = await prisma.page.create({
      data: {
        author: {
          connect: {
            id: user.id
          }
        },
        space: {
          connect: {
            id: space.id
          }
        },
        title: 'Test',
        type: 'page',
        contentText: '',
        content: {},
        path: `path-${v4()}`,
        updatedBy: user.id
      }
    });

    await expect(getForumPost({ pageId: page.id, userId: '' })).rejects.toBeInstanceOf(PageNotFoundError);
  });
});
