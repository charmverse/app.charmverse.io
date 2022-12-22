import type { Page, Post, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import { InsecureOperationError, UndesirableOperationError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateForumPost } from 'testing/utils/forums';

import { getForumPost } from '../getForumPost';
import { updateForumPost } from '../updateForumPost';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('updateForumPost', () => {
  it('should only update page.content, page.contentText, page.title, and post.categoryId', async () => {
    const [category1, category2] = await Promise.all([
      createPostCategory({ name: 'First', spaceId: space.id }),
      createPostCategory({ name: 'Second', spaceId: space.id })
    ]);

    const createdPage = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: category1.id
    });

    const droppedPageUpdate: Partial<Page> = {
      createdAt: new Date(),
      deletedAt: new Date(),
      postId: v4(),
      createdBy: v4(),
      path: `new-path-${v4()}`
    };

    const droppedPostUpdate: Partial<Post> = {
      locked: true,
      pinned: true
    };

    const pageUpdate: Partial<Page> = {
      content: { type: 'doc', content: [] } as any,
      contentText: 'New content text',
      title: 'New post title'
    };

    const postUpdate: Partial<Post> = {
      categoryId: category2.id
    };

    const groupedUpdate = {
      ...droppedPageUpdate,
      ...droppedPostUpdate,
      ...pageUpdate,
      ...postUpdate
    };

    await updateForumPost({
      ...(groupedUpdate as any),
      postId: createdPage.id,
      userId: user.id
    });
    const updatedForumPost = await getForumPost({ pageId: createdPage.id });

    // ---------------------- Make sure data was preserved ----------------------
    typedKeys(droppedPageUpdate).forEach((key) => {
      // Change not passed through
      expect(updatedForumPost[key]).not.toEqual(droppedPageUpdate[key]);
      // Old data still present
      expect(updatedForumPost[key]).toEqual(createdPage[key]);
    });

    typedKeys(droppedPostUpdate).forEach((key) => {
      // Change not passed through
      expect(updatedForumPost.post[key]).not.toEqual(droppedPostUpdate[key]);
      // Old data still present
      expect(updatedForumPost.post[key]).toEqual(createdPage.post[key]);
    });

    // ---------------------- Make sure new data is present ----------------------
    typedKeys(pageUpdate).forEach((key) => {
      expect(updatedForumPost[key]).toEqual(pageUpdate[key]);
    });

    typedKeys(postUpdate).forEach((key) => {
      expect(updatedForumPost.post[key]).toEqual(postUpdate[key]);
    });
  });

  it('should fail to update the post category if the category is in a different space', async () => {
    const { space: secondSpace } = await generateUserAndSpaceWithApiToken();

    const [category1, otherSpaceCategory] = await Promise.all([
      createPostCategory({ name: 'Third', spaceId: space.id }),
      createPostCategory({ name: 'Fourth', spaceId: secondSpace.id })
    ]);

    const createdPage = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: category1.id
    });

    const postUpdate: Partial<Post> = {
      categoryId: otherSpaceCategory.id
    };

    await expect(
      updateForumPost({ postId: createdPage.id, userId: user.id, ...(postUpdate as any) })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });

  it('should fail to update if the post is locked', async () => {
    const createdPage = await generateForumPost({
      userId: user.id,
      spaceId: space.id
    });

    await prisma.post.update({
      where: {
        id: createdPage.post.id
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

    await expect(updateForumPost({ ...pageUpdate, userId: user.id, postId: createdPage.id })).rejects.toBeInstanceOf(
      UndesirableOperationError
    );
  });
});
