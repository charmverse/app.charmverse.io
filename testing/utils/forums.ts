import type { PostStatus } from '@prisma/client';
import { v4 } from 'uuid';

import { createPostComment } from 'lib/forums/comments/createPostComment';
import type { CreatePostCommentInput } from 'lib/forums/comments/interface';
import { createForumPost } from 'lib/forums/posts/createForumPost';

export async function generatePostComment({
  userId,
  spaceId,
  status = 'draft'
}: {
  status?: PostStatus;
  spaceId: string;
  userId: string;
}) {
  const commentInput: CreatePostCommentInput = {
    content: {
      type: ''
    },
    contentText: '',
    parentId: v4()
  };

  const post = await generateForumPost({
    spaceId,
    userId,
    status
  });

  const postComment = await createPostComment({
    ...commentInput,
    postId: post.id,
    userId
  });

  return {
    comment: postComment,
    post
  };
}

export async function generateForumPost({
  status = 'draft',
  userId,
  spaceId
}: {
  userId: string;
  spaceId: string;
  status?: PostStatus;
}) {
  return createForumPost({
    content: {
      type: ''
    },
    status,
    contentText: '',
    createdBy: userId,
    spaceId,
    title: 'Title'
  });
}
