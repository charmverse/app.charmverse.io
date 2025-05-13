import type { PostCommentUpDownVote, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generateForumPost } from '@packages/testing/utils/forums';
import { createPostComment } from '@packages/lib/forums/comments/createPostComment';

import { voteForumComment } from '../voteForumComment';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('voteForumPost', () => {
  it('should create comment vote if upvoted is true and return correct vote information', async () => {
    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      title: 'Test'
    });

    const comment = await createPostComment({
      content: null as any,
      contentText: '',
      postId: createdPost.id!,
      userId: user.id
    });

    const commentVote = await voteForumComment({
      upvoted: true,
      userId: user.id,
      commentId: comment.id,
      postId: createdPost.id!
    });

    expect(commentVote).toStrictEqual<PostCommentUpDownVote>({
      commentId: comment.id,
      createdAt: expect.any(Date),
      createdBy: user.id,
      postId: createdPost.id!,
      upvoted: true
    });
  });

  it('should change users existing vote if they vote again on same comment', async () => {
    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      title: 'Test'
    });

    const comment = await createPostComment({
      content: null as any,
      contentText: '',
      postId: createdPost.id!,
      userId: user.id
    });

    const commentVote = await voteForumComment({
      upvoted: true,
      userId: user.id,
      commentId: comment.id,
      postId: createdPost.id!
    });

    const secondCommentVote = await voteForumComment({
      upvoted: false,
      userId: user.id,
      commentId: comment.id,
      postId: createdPost.id!
    });

    const commentVotes = await prisma.postCommentUpDownVote.findMany({
      where: {
        commentId: comment.id
      }
    });

    expect(commentVotes).toHaveLength(1);

    // We don't have an ID field on this model, so we compare creation dates to check it's the same entity
    expect(secondCommentVote?.createdAt).toEqual(commentVote?.createdAt);
  });

  it('should delete post comment vote if upvoted is null', async () => {
    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      title: 'Test'
    });

    const comment = await createPostComment({
      content: null as any,
      contentText: '',
      postId: createdPost.id!,
      userId: user.id
    });

    await voteForumComment({
      upvoted: true,
      userId: user.id,
      commentId: comment.id,
      postId: createdPost.id!
    });

    await voteForumComment({
      upvoted: null,
      userId: user.id,
      commentId: comment.id,
      postId: createdPost.id!
    });

    const commentVotes = await prisma.postCommentUpDownVote.findMany({
      where: {
        commentId: comment.id
      }
    });

    expect(commentVotes).toHaveLength(0);
  });
});
