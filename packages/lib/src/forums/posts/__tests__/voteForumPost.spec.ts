import type { Space, User } from '@charmverse/core/prisma';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePostCategory, generateForumPost } from '@packages/testing/utils/forums';

import { createForumPost } from '../createForumPost';
import { getPostVote } from '../getPostVote';
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
    const category1 = await generatePostCategory({ name: 'First', spaceId: space.id });

    const createdPost = await createForumPost({
      content: null,
      contentText: '',
      createdBy: user.id,
      spaceId: space.id,
      title: 'Test',
      categoryId: category1.id,
      isDraft: false
    });

    await voteForumPost({
      postId: createdPost.id!,
      userId: user.id,
      upvoted: true
    });

    const postPageVote = await getPostVote({
      userId: user.id,
      pageId: createdPost.id
    });

    expect(postPageVote).toStrictEqual({
      downvotes: 0,
      upvotes: 1,
      upvoted: true
    });
  });

  it('should update page vote if upvoted is false and return correct vote information', async () => {
    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id
    });

    await voteForumPost({
      postId: createdPost.id,
      userId: user.id,
      upvoted: true
    });

    await voteForumPost({
      postId: createdPost.id,
      userId: user.id,
      upvoted: false
    });

    const postPageVote = await getPostVote({
      userId: user.id,
      pageId: createdPost.id
    });

    expect(postPageVote).toStrictEqual({
      downvotes: 1,
      upvotes: 0,
      upvoted: false
    });
  });

  it('should delete page vote if upvoted is null and return correct vote information', async () => {
    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id
    });

    await voteForumPost({
      postId: createdPost.id,
      userId: user.id,
      upvoted: true
    });

    await voteForumPost({
      postId: createdPost.id,
      userId: user.id,
      upvoted: null
    });

    const postPageVote = await getPostVote({
      userId: user.id,
      pageId: createdPost.id
    });

    expect(postPageVote).toStrictEqual({
      downvotes: 0,
      upvotes: 0,
      upvoted: null
    });
  });
});
