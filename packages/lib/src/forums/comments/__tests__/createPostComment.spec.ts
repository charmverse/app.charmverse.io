import type { PostComment, Space, User } from '@charmverse/core/prisma';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generateForumPost } from '@packages/testing/utils/forums';
import { v4 } from 'uuid';

import { createPostComment } from '../createPostComment';
import type { CreatePostCommentInput } from '../interface';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('createPostComment', () => {
  it('should create a post comment', async () => {
    const commentInput: CreatePostCommentInput = {
      content: {
        type: ''
      },
      contentText: '',
      parentId: v4()
    };

    const post = await generateForumPost({
      spaceId: space.id,
      userId: user.id
    });

    const postComment = await createPostComment({
      ...commentInput,
      postId: post.id,
      userId: user.id
    });

    expect(postComment).toMatchObject(
      expect.objectContaining<Partial<PostComment>>({
        ...commentInput,
        postId: post.id
      })
    );
  });
});
