import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type {
  BlockCommentNotification,
  BlockCommentNotificationType,
  BountyNotificationType,
  CommentNotification,
  CommentNotificationType,
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
      type: 'created';
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
  return prisma.postNotification.create({
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
  return prisma.proposalNotification.create({
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

type CreateDocumentNotificationInput = {
  createdBy: string;
  pageId: string;
  spaceId: string;
  userId: string;
  mentionId?: string;
  inlineCommentId?: string;
} & (InlineCommentNotification | MentionNotification);

export async function createDocumentNotification({
  createdBy,
  mentionId,
  pageId,
  inlineCommentId,
  spaceId,
  userId,
  type
}: CreateDocumentNotificationInput) {
  const notificationId = v4();
  return prisma.documentNotification.create({
    data: {
      id: notificationId,
      type,
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
              id: inlineCommentId
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

export type CreateCardNotificationInput = {
  type: BlockCommentNotificationType | InlineCommentNotificationType | MentionNotificationType | 'person_assigned';
  cardId: string;
  createdBy: string;
  spaceId: string;
  userId: string;
  blockCommentId?: string;
  personPropertyId?: string;
} & (
  | BlockCommentNotification
  | {
      type: 'person_assigned';
      personPropertyId: string;
    }
);

export async function createCardNotification({
  type,
  personPropertyId,
  createdBy,
  spaceId,
  userId,
  blockCommentId,
  cardId
}: CreateCardNotificationInput) {
  const notificationId = v4();
  return prisma.cardNotification.create({
    data: {
      id: notificationId,
      type,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
      blockComment: blockCommentId
        ? {
            connect: {
              id: blockCommentId
            }
          }
        : undefined,
      card: { connect: { id: cardId } },
      personPropertyId
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
  return prisma.voteNotification.create({
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
        'suggestion.created' | MentionNotificationType | InlineCommentNotificationType
      >;
      applicationId: string;
    }
  | {
      type: 'suggestion.created';
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
  return prisma.bountyNotification.create({
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
