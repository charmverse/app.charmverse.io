import { prisma } from 'db';
import { isTruthy } from 'lib/utilities/types';

import type { ForumNotificationsInput, ForumNotifications } from './getForumNotifications';
import { getPropertiesFromPost } from './utils';
/**
 * Get all comments that match these 2:
 * 1. My page, but not my comments
 * 2. Not my page, just comments that are direct replies after my comment
 */
export async function getPostComments({
  userId,
  spaceIds,
  spaceRecord
}: ForumNotificationsInput): Promise<ForumNotifications> {
  const comments = await prisma.postComment.findMany({
    where: {
      createdBy: {
        not: userId
      },
      deletedAt: null,
      post: {
        spaceId: {
          in: spaceIds
        },
        deletedAt: null
      }
    },
    include: {
      post: {
        select: {
          createdBy: true,
          path: true,
          title: true,
          spaceId: true,
          id: true
        }
      }
    }
  });
  // Comments that are not created by the user but are on a post page created by the user
  const commentsOnTheUserPage = comments.filter((comment) => comment.post.createdBy === userId);

  const parentComments = await prisma.postComment.findMany({
    where: {
      id: {
        in: comments.map((c) => c.parentId ?? '').filter(isTruthy)
      },
      createdBy: userId,
      deletedAt: null,
      post: {
        spaceId: {
          in: spaceIds
        },
        createdBy: {
          not: userId
        },
        deletedAt: null
      }
    }
  });
  const parentCommentIds = parentComments.map((comment) => comment.id);

  // Comments that are not created by the user, are on a post page that is not created by the user and the parent is the user
  const commentReplies = comments.filter(
    (comment) => comment.post.createdBy !== userId && parentCommentIds.includes(comment.parentId ?? '')
  );

  const allComments = [...commentsOnTheUserPage, ...commentReplies];

  const commentTasks = allComments.map((comment) => {
    return {
      ...getPropertiesFromPost(comment.post, spaceRecord),
      createdAt: new Date(comment.createdAt).toISOString(),
      userId: comment.createdBy,
      commentText: comment.contentText,
      commentId: comment.id,
      mentionId: null
    };
  });

  return {
    mentions: [],
    discussionUserIds: commentTasks.map((comm) => comm.userId).concat([userId]),
    comments: commentTasks
  };
}
