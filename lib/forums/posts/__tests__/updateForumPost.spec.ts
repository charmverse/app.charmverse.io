import { prisma } from '@charmverse/core';
import type { Page, Post, Space, User } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

import { InsecureOperationError, UndesirableOperationError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

import { updateForumPost } from '../updateForumPost';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('updateForumPost', () => {
  it('should only update post.content, post.contentText, post.title, and post.categoryId', async () => {
    const [category1, category2] = await Promise.all([
      generatePostCategory({ name: 'First', spaceId: space.id }),
      generatePostCategory({ name: 'Second', spaceId: space.id })
    ]);

    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: category1.id
    });

    const droppedPostUpdate: Partial<Post> = {
      createdAt: new Date(),
      createdBy: v4(),
      path: `new-path-${v4()}`,
      locked: true,
      pinned: true
    };

    const postUpdate: Partial<Post> = {
      content: { type: 'doc', content: [] } as any,
      contentText: 'New content text',
      title: 'New post title',
      categoryId: category2.id
    };

    const groupedUpdate = {
      ...droppedPostUpdate,
      ...postUpdate
    };

    await updateForumPost(createdPost.id, groupedUpdate);

    const updatedPost = await prisma.post.findUniqueOrThrow({
      where: {
        id: createdPost.id
      }
    });

    typedKeys(postUpdate).forEach((key) => {
      expect(updatedPost[key]).toEqual(postUpdate[key]);
    });

    typedKeys(droppedPostUpdate).forEach((key) => {
      expect(updatedPost[key]).not.toEqual(postUpdate[key]);
    });
  });

  it('should fail to update the post category if the category is in a different space', async () => {
    const { space: secondSpace } = await generateUserAndSpaceWithApiToken();

    const [category1, otherSpaceCategory] = await Promise.all([
      generatePostCategory({ name: 'Third', spaceId: space.id }),
      generatePostCategory({ name: 'Fourth', spaceId: secondSpace.id })
    ]);

    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: category1.id
    });

    const postUpdate: Partial<Post> = {
      categoryId: otherSpaceCategory.id
    };

    await expect(updateForumPost(createdPost.id, postUpdate)).rejects.toBeInstanceOf(InsecureOperationError);
  });

  it('should fail to update if the post is locked', async () => {
    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id
    });

    await prisma.post.update({
      where: {
        id: createdPost.id
      },
      data: {
        locked: true
      }
    });

    const pageUpdate: Partial<Page> = {
      content: { type: 'doc', content: [] } as any,
      contentText: 'New content text',
      title: 'New post title'
    };

    await expect(updateForumPost(createdPost.id, pageUpdate)).rejects.toBeInstanceOf(UndesirableOperationError);
  });
});
