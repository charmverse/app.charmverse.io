import type { Post, Prisma, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateForumPost } from 'testing/utils/forums';

import { PostNotFoundError } from '../errors';
import { getForumPost } from '../getForumPost';
import type { PostWithVotes } from '../interfaces';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
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

  it('should allow looking up a post via path + spaceId', async () => {
    const postPath = `post-path-${v4()}`;

    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      path: postPath
    });

    const retrievedPost = await getForumPost({ postId: postPath, spaceId: createdPost.spaceId });

    expect(retrievedPost).toMatchObject(
      expect.objectContaining<Partial<PostWithVotes>>({
        id: expect.any(String),
        content: expect.any(Object),
        locked: false,
        pinned: false,
        title: createdPost.title
      })
    );
  });

  it('should throw an error if a path is provided without a spaceId', async () => {
    await expect(getForumPost({ postId: `post-path`, spaceId: undefined })).rejects.toBeInstanceOf(InvalidInputError);
  });
  it('should throw an error if the post does not exist', async () => {
    await expect(getForumPost({ postId: v4() })).rejects.toBeInstanceOf(PostNotFoundError);
  });
});
