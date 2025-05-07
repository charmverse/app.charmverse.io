import { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generateForumPost } from '@packages/testing/utils/forums';
import { v4 } from 'uuid';

import { PostCommentNotFoundError } from '../errors';
import { getPostComment } from '../getPostComment';

describe('getPostComment', () => {
  it('should return a post comment', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const post = await generateForumPost({
      spaceId: space.id,
      userId: user.id
    });

    const comment = await prisma.postComment.create({
      data: {
        post: {
          connect: {
            id: post.id
          }
        },
        user: {
          connect: {
            id: user.id
          }
        },
        content: Prisma.JsonNull,
        contentText: 'comment'
      }
    });

    const retrievedComment = await getPostComment(comment.id);

    expect(retrievedComment).toEqual(comment);
  });

  it('should throw an error if the comment does not exist', async () => {
    await expect(getPostComment(v4())).rejects.toBeInstanceOf(PostCommentNotFoundError);
  });
});
