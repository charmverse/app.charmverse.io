import type { Post, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createForumPost } from '../createForumPost';
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
    const createdPage = await createForumPost({
      content: {},
      contentText: '',
      createdBy: user.id,
      spaceId: space.id,
      title: 'Test',
      categoryId: null
    });

    expect(createdPage).toMatchObject(
      expect.objectContaining<Partial<ForumPostPage>>({
        id: expect.any(String),
        postId: expect.any(String),
        content: expect.any(Object),
        contentText: expect.any(String),
        post: expect.objectContaining<Partial<Post>>({
          locked: false,
          pinned: false,
          status: 'draft'
        })
      })
    );

    const retrievedPost = await getForumPost(createdPage.id);

    expect(retrievedPost).toMatchObject(expect.objectContaining(createdPage));
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

    const result = await getForumPost(page.id);

    expect(result).toBeNull();

    const inexistentPage = await getForumPost(v4());

    expect(inexistentPage).toBeNull();
  });
});
