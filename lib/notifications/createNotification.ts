import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type {
  DiscussionNotificationType,
  ForumNotificationType,
  ProposalNotificationType,
  VoteNotificationType
} from './interfaces';

type CreatePostNotificationInput = {
  createdBy: string;
  postId: string;
  spaceId: string;
  userId: string;
  commentId?: string;
  mentionId?: string;
  type: ForumNotificationType;
} & (
  | {
      type: 'post.created';
    }
  | {
      type: 'post.comment.created';
      commentId: string;
    }
  | {
      type: 'post.comment.replied';
      commentId: string;
    }
  | {
      type: 'post.mention.created';
      mentionId: string;
    }
  | {
      type: 'post.comment.mention.created';
      mentionId: string;
      commentId: string;
    }
);

export async function createPostNotification({
  createdBy,
  commentId,
  mentionId,
  postId,
  spaceId,
  userId,
  type
}: CreatePostNotificationInput) {
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

type CreatePageNotificationInput = {
  createdBy: string;
  pageId: string;
  spaceId: string;
  userId: string;
  commentId?: string;
  mentionId?: string;
  inlineCommentId?: string;
  type: DiscussionNotificationType;
} & (
  | {
      type: 'comment.created';
      commentId: string;
    }
  | {
      type: 'comment.replied';
      commentId: string;
    }
  | {
      type: 'comment.mention.created';
      mentionId: string;
      commentId: string;
    }
  | {
      type: 'inline_comment.created';
      inlineCommentId: string;
    }
  | {
      type: 'inline_comment.replied';
      inlineCommentId: string;
    }
  | {
      type: 'inline_comment.mention.created';
      mentionId: string;
      inlineCommentId: string;
    }
  | {
      type: 'mention.created';
      mentionId: string;
    }
);

export async function createPageNotification({
  createdBy,
  commentId,
  mentionId,
  pageId,
  inlineCommentId,
  spaceId,
  userId,
  type
}: CreatePageNotificationInput) {
  await prisma.pageNotification.create({
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
      inlineComment: inlineCommentId
        ? {
            connect: {
              id: commentId
            }
          }
        : undefined,
      page: {
        connect: {
          id: pageId
        }
      }
    }
  });
}

export async function createProposalNotification({
  type,
  createdBy,
  spaceId,
  userId,
  proposalId
}: {
  type: ProposalNotificationType;
  proposalId: string;
  createdBy: string;
  spaceId: string;
  userId: string;
}) {
  await prisma.proposalNotification.create({
    data: {
      type,
      id: v4(),
      notificationMetadata: {
        create: {
          createdBy,
          spaceId,
          userId
        }
      },
      proposal: {
        connect: {
          id: proposalId
        }
      }
    }
  });
}

export async function createVoteNotification({
  type,
  createdBy,
  spaceId,
  userId,
  voteId
}: {
  type: VoteNotificationType;
  voteId: string;
  createdBy: string;
  spaceId: string;
  userId: string;
}) {
  await prisma.voteNotification.create({
    data: {
      type,
      id: v4(),
      notificationMetadata: {
        create: {
          createdBy,
          spaceId,
          userId
        }
      },
      vote: {
        connect: {
          id: voteId
        }
      }
    }
  });
}
