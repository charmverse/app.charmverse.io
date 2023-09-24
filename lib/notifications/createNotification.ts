import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type {
  BountyNotificationType,
  CommentNotification,
  CommentNotificationType,
  DiscussionNotificationType,
  ForumNotificationType,
  InlineCommentNotification,
  InlineCommentNotificationType,
  MentionNotification,
  MentionNotificationType,
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
  | CommentNotification
  | MentionNotification
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
  const notificationId = v4();
  await prisma.postNotification.create({
    data: {
      type,
      id: notificationId,
      mentionId,
      notificationMetadata: {
        create: {
          id: notificationId,
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
} & (InlineCommentNotification | MentionNotification);

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
  const notificationId = v4();
  await prisma.pageNotification.create({
    data: {
      type,
      id: notificationId,
      mentionId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
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

export type CreateProposalNotificationInput = {
  type: ProposalNotificationType;
  proposalId: string;
  createdBy: string;
  spaceId: string;
  userId: string;
  commentId?: string;
  mentionId?: string;
  inlineCommentId?: string;
} & (
  | CommentNotification
  | InlineCommentNotification
  | MentionNotification
  | {
      type: Exclude<
        ProposalNotificationType,
        CommentNotificationType | InlineCommentNotificationType | MentionNotificationType
      >;
    }
);

export async function createProposalNotification({
  type,
  createdBy,
  spaceId,
  userId,
  proposalId,
  commentId,
  inlineCommentId,
  mentionId
}: CreateProposalNotificationInput) {
  const notificationId = v4();
  await prisma.proposalNotification.create({
    data: {
      type,
      id: notificationId,
      notificationMetadata: {
        create: {
          id: notificationId,
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
      inlineComment: inlineCommentId ? { connect: { id: inlineCommentId } } : undefined,
      mentionId,
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
  const notificationId = v4();
  await prisma.voteNotification.create({
    data: {
      type,
      id: notificationId,
      notificationMetadata: {
        create: {
          id: notificationId,
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

type CreateBountyNotificationInput = {
  type: BountyNotificationType;
  bountyId: string;
  createdBy: string;
  spaceId: string;
  userId: string;
  mentionId?: string;
  inlineCommentId?: string;
  applicationId?: string;
} & (
  | {
      type: Exclude<
        BountyNotificationType,
        | 'suggestion_created'
        | 'mention.created'
        | 'inline_comment.created'
        | 'inline_comment.replied'
        | 'inline_comment.mention.created'
      >;
      applicationId: string;
    }
  | {
      type: 'suggestion_created';
    }
  | MentionNotification
  | InlineCommentNotification
);

export async function createBountyNotification({
  type,
  createdBy,
  spaceId,
  userId,
  bountyId,
  applicationId,
  inlineCommentId,
  mentionId
}: CreateBountyNotificationInput) {
  const notificationId = v4();
  await prisma.bountyNotification.create({
    data: {
      type,
      id: notificationId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
      mentionId,
      inlineComment: inlineCommentId ? { connect: { id: inlineCommentId } } : undefined,
      application: applicationId
        ? {
            connect: {
              id: applicationId
            }
          }
        : undefined,
      bounty: {
        connect: {
          id: bountyId
        }
      }
    }
  });
}
