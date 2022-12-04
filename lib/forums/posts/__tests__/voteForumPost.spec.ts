import type { Space, User } from '@prisma/client';

import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createForumPost } from '../createForumPost';
import { voteForumPost } from '../voteForumPost';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('voteForumPost', () => {
  it('should create page vote if upvoted is true and return correct vote information', async () => {
    const [category1] = await Promise.all([createPostCategory({ name: 'First', spaceId: space.id })]);

    const createdPage = await createForumPost({
      content: {},
      contentText: '',
      createdBy: user.id,
      spaceId: space.id,
      title: 'Test',
      categoryId: category1.id
    });

    const postPageVote = await voteForumPost({
      pageId: createdPage.id,
      userId: user.id,
      upvoted: true
    });

    expect(postPageVote).toStrictEqual({
      downvotes: 0,
      upvotes: 1,
      upvoted: true
    });
  });

  it('should update page vote if upvoted is false and return correct vote information', async () => {
    const [category1] = await Promise.all([createPostCategory({ name: 'Second', spaceId: space.id })]);

    const createdPage = await createForumPost({
      content: {},
      contentText: '',
      createdBy: user.id,
      spaceId: space.id,
      title: 'Test',
      categoryId: category1.id
    });

    await voteForumPost({
      pageId: createdPage.id,
      userId: user.id,
      upvoted: true
    });

    const postPageVote = await voteForumPost({
      pageId: createdPage.id,
      userId: user.id,
      upvoted: false
    });

    expect(postPageVote).toStrictEqual({
      downvotes: 1,
      upvotes: 0,
      upvoted: false
    });
  });

  it('should delete page vote if upvoted is undefined and return correct vote information', async () => {
    const [category1] = await Promise.all([createPostCategory({ name: 'Third', spaceId: space.id })]);

    const createdPage = await createForumPost({
      content: {},
      contentText: '',
      createdBy: user.id,
      spaceId: space.id,
      title: 'Test',
      categoryId: category1.id
    });

    await voteForumPost({
      pageId: createdPage.id,
      userId: user.id,
      upvoted: true
    });

    const postPageVote = await voteForumPost({
      pageId: createdPage.id,
      userId: user.id,
      upvoted: undefined
    });

    expect(postPageVote).toStrictEqual({
      downvotes: 0,
      upvotes: 0,
      upvoted: undefined
    });
  });
});
