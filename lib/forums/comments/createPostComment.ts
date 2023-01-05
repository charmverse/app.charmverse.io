import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';

import { getForumPost } from '../posts/getForumPost';

import type { CreatePostCommentInput } from './interface';

export async function createPostComment({
  content,
  contentText,
  parentId,
  postId,
  userId
}: CreatePostCommentInput & {
  postId: string;
  userId: string;
}) {
  const page = await prisma.page.findUnique({
    where: { id: postId },
    include: {
      post: {
        include: {
          category: true
        }
      }
    }
  });

  const comment = await prisma.pageComment.create({
    data: {
      content,
      contentText: contentText.trim(),
      createdBy: userId,
      pageId: postId,
      parentId
    },
    include: {
      user: {
        select: {
          id: true,
          avatar: true,
          username: true
        }
      }
    }
  });

  const category = page?.post?.category;

  if (category) {
    trackUserAction('create_comment', {
      categoryName: category.name,
      commentedOn: parentId === postId ? 'post' : 'comment',
      postId,
      resourceId: comment.id,
      spaceId: page.spaceId,
      userId
    });
  }

  return comment;
}
