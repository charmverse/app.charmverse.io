import type { Post, Prisma, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateForumPost } from '@packages/testing/utils/forums';
import { v4 } from 'uuid';

import { PostNotFoundError } from '../errors';
import { getForumPost } from '../getForumPost';
import type { PostWithVotes } from '../interfaces';

let space: Space;
let user: User;

const spaceCustomDomain = 'test-domain.com';

beforeAll(async () => {
  const generated = await generateUserAndSpace({ spaceCustomDomain });
  space = generated.space;
  user = generated.user;
});

describe('getForumPost', () => {
  it('should return the post', async () => {
    const testTitle = 'Test Title';

    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      title: testTitle
    });

    const retrievedPost = await getForumPost({ postId: createdPost.id });

    expect(retrievedPost).toMatchObject(
      expect.objectContaining<Partial<Post>>({
        id: expect.any(String),
        content: expect.any(Object),
        locked: false,
        pinned: false,
        title: testTitle
      })
    );
  });

  it('should support looking up the post by post path + spacedomain', async () => {
    const postTitle = `Test Title-${v4()}`;

    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      title: postTitle
    });
    const retrievedPost = await getForumPost({ postId: createdPost.path, spaceDomain: space.domain });

    expect(retrievedPost).toMatchObject(
      expect.objectContaining<Partial<Post>>({
        id: expect.any(String),
        content: expect.any(Object),
        locked: false,
        pinned: false,
        title: postTitle
      })
    );
  });

  it('should support looking up the post by post path + custom domain', async () => {
    const postTitle = `Test Title-${v4()}`;

    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      title: postTitle
    });
    const retrievedPost = await getForumPost({ postId: createdPost.path, spaceDomain: spaceCustomDomain });

    expect(retrievedPost).toMatchObject(
      expect.objectContaining<Partial<Post>>({
        id: expect.any(String),
        content: expect.any(Object),
        locked: false,
        pinned: false,
        title: postTitle
      })
    );
  });

  it('should include a rollup of votes for this post', async () => {
    const testTitle = 'Test Title';
    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      title: testTitle
    });

    const postVoters: User[] = [];

    const totalVoters = 10;

    for (let i = 0; i < totalVoters; i++) {
      const votingUser = await generateSpaceUser({
        spaceId: space.id,
        isAdmin: false
      });
      postVoters.push(votingUser);
    }

    const voteInputs: Prisma.PostUpDownVoteCreateManyInput[] = postVoters.map((voter) => ({
      postId: createdPost.id,
      createdBy: voter.id,
      upvoted: Math.random() > 0.5
    }));

    const totalUpvotes = voteInputs.filter((vote) => vote.upvoted).length;
    const totalDownvotes = voteInputs.length - totalUpvotes;

    await prisma.postUpDownVote.createMany({
      data: voteInputs
    });

    const requestingUserId = postVoters[0].id;

    const retrievedPost = await getForumPost({ postId: createdPost.id, userId: requestingUserId });

    expect(retrievedPost).toMatchObject(
      expect.objectContaining<Partial<PostWithVotes>>({
        id: expect.any(String),
        content: expect.any(Object),
        locked: false,
        pinned: false,
        title: testTitle,
        votes: {
          downvotes: totalDownvotes,
          upvotes: totalUpvotes,
          upvoted: voteInputs[0].upvoted
        }
      })
    );
  });

  it('should throw an error if the post does not exist', async () => {
    await expect(getForumPost({ postId: v4() })).rejects.toBeInstanceOf(PostNotFoundError);
  });
});
