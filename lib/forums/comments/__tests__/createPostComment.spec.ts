import type { PageComment, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { createPage, generateForumPost, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

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

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const post = await generateForumPost({
      pageId: page.id
    });

    const postComment = await createPostComment({
      ...commentInput,
      postId: post.id,
      userId: user.id
    });

    expect(postComment).toMatchObject(
      expect.objectContaining<Partial<PageComment>>({
        ...commentInput,
        pageId: page.id
      })
    );
  });
});
