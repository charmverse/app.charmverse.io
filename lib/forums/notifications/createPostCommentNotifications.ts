import type { PostComment } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { getPostCategoriesUsersRecord } from './getPostCategoriesUsersRecord';

async function createPostNotification({
  commentId,
  createdBy,
  mentionId,
  postId,
  spaceId,
  userId,
  type
}: {
  type: string;
  mentionId: string | null;
  spaceId: string;
  userId: string;
  createdBy: string;
  commentId: string | null;
  postId: string;
}) {
  await prisma.postNotification.create({
    data: {
      type,
      id: v4(),
      mentionId,
      notificationMetadata: {
        create: {
          createdBy,
          spaceId,
          userId
        }
      },
      comment: commentId
        ? {
            connect: {
              id: commentId
            }
          }
        : undefined,
      post: {
        connect: {
          id: postId
        }
      }
    }
  });
}

export async function createPostCommentNotifications({
  postComment,
  spaceId,
  userId
}: {
  userId: string;
  postComment: PostComment;
  spaceId: string;
}) {
  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id: postComment.postId
    },
    select: {
      createdBy: true
    }
  });
  const postAuthor = post.createdBy;
  const postCategoriesUsersRecord = await getPostCategoriesUsersRecord({
    spaceId
  });

  const extractedMentions = extractMentions(postComment.content as PageContent);

  const postCategoriesUsersRecords = Object.values(postCategoriesUsersRecord);
  for (const postCategoriesUserRecord of postCategoriesUsersRecords) {
    const userMentions = extractedMentions.filter((mention) => mention.value === postCategoriesUserRecord.userId);
    for (const userMention of userMentions) {
      await createPostNotification({
        commentId: postComment.id,
        createdBy: postComment.createdBy,
        mentionId: userMention.id,
        postId: postComment.postId,
        spaceId,
        userId: postCategoriesUserRecord.userId,
        type: 'post.comment.mention.created'
      });
    }
  }

  const parentId = postComment.parentId;
  if (!parentId && userId !== postAuthor) {
    await createPostNotification({
      commentId: postComment.id,
      createdBy: postComment.createdBy,
      mentionId: null,
      postId: postComment.postId,
      spaceId,
      userId: postAuthor,
      type: 'post.comment.created'
    });
  }

  if (parentId) {
    const parentComment = await prisma.pageComment.findUniqueOrThrow({
      where: {
        id: parentId
      },
      select: {
        createdBy: true
      }
    });
    const parentCommentAuthor = parentComment.createdBy;
    await createPostNotification({
      commentId: postComment.id,
      createdBy: postComment.createdBy,
      mentionId: null,
      postId: postComment.postId,
      spaceId,
      userId: parentCommentAuthor,
      type: 'post.comment.replied'
    });
  }
}
