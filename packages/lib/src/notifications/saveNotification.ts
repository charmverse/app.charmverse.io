import { Prisma, prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import { v4 } from 'uuid';

import type {
  ApplicationCommentNotification,
  BountyNotificationType,
  CommentNotification,
  DocumentNotificationType,
  InlineCommentNotification,
  MentionNotification,
  PostNotificationType,
  ProposalNotificationType,
  VoteNotificationType
} from './interfaces';

type NotificationInput = {
  createdAt: string;
  createdBy: string;
  spaceId: string;
  userId: string;
};

type PostNotificationInput = NotificationInput & {
  postId: string;
  type: PostNotificationType;
};

export async function savePostNotification({
  createdAt,
  createdBy,
  postId,
  spaceId,
  userId,
  type
}: PostNotificationInput) {
  const notificationId = v4();
  const record = await prisma.postNotification.create({
    data: {
      type,
      id: notificationId,
      notificationMetadata: {
        create: {
          createdAt,
          id: notificationId,
          createdBy,
          spaceId,
          userId
        }
      },
      post: {
        connect: {
          id: postId
        }
      }
    }
  });
  log.info('Created post notification', { postId, notificationId: record.id, spaceId, userId, createdBy, type });
  return record;
}

type ProposalNotificationInput = NotificationInput & {
  type: ProposalNotificationType;
  proposalId: string;
  evaluationId?: string | null;
};

export async function saveProposalNotification({
  type,
  createdAt,
  createdBy,
  spaceId,
  userId,
  proposalId,
  evaluationId
}: ProposalNotificationInput) {
  const notificationId = v4();
  const record = await prisma.proposalNotification.create({
    data: {
      type,
      id: notificationId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdAt,
          createdBy,
          // mark as seen if you already saw it
          seenAt: createdBy === userId ? new Date() : undefined,
          spaceId,
          userId
        }
      },
      evaluation: evaluationId
        ? {
            connect: {
              id: evaluationId
            }
          }
        : undefined,
      proposal: {
        connect: {
          id: proposalId
        }
      }
    }
  });
  log.info('Created proposal notification', {
    proposalId,
    notificationId: record.id,
    spaceId,
    userId,
    createdBy,
    type
  });
  return record;
}

type DocumentNotificationInput = NotificationInput & {
  pageId?: string;
  postId?: string;
  mentionId?: string;
  inlineCommentId?: string;
  postCommentId?: string;
  pageCommentId?: string;
  applicationCommentId?: string;
  type: DocumentNotificationType;
  content: Prisma.JsonValue | null;
} & (CommentNotification | MentionNotification | InlineCommentNotification | ApplicationCommentNotification);

export async function saveDocumentNotification({
  createdAt,
  createdBy,
  mentionId,
  pageId,
  inlineCommentId,
  spaceId,
  postId,
  userId,
  content,
  type,
  pageCommentId,
  postCommentId,
  applicationCommentId
}: DocumentNotificationInput) {
  const notificationId = v4();
  const record = await prisma.documentNotification.create({
    data: {
      id: notificationId,
      type,
      mentionId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdAt,
          createdBy,
          spaceId,
          userId
        }
      },
      content: content ?? Prisma.DbNull,
      inlineComment: inlineCommentId
        ? {
            connect: {
              id: inlineCommentId
            }
          }
        : undefined,
      postComment: postCommentId
        ? {
            connect: {
              id: postCommentId
            }
          }
        : undefined,
      pageComment: pageCommentId
        ? {
            connect: {
              id: pageCommentId
            }
          }
        : undefined,
      applicationComment: applicationCommentId
        ? {
            connect: {
              id: applicationCommentId
            }
          }
        : undefined,
      post: postId
        ? {
            connect: {
              id: postId
            }
          }
        : undefined,
      page: pageId
        ? {
            connect: {
              id: pageId
            }
          }
        : undefined
    }
  });
  log.info('Created document notification', {
    pageId,
    notificationId: record.id,
    spaceId,
    userId,
    createdBy,
    type
  });
  return record;
}

export type CardNotificationInput = NotificationInput & {
  cardId: string;
  type: 'person_assigned';
  personPropertyId: string;
};

export async function saveCardNotification({
  type,
  personPropertyId,
  createdAt,
  createdBy,
  spaceId,
  userId,
  cardId
}: CardNotificationInput) {
  const notificationId = v4();
  const record = await prisma.cardNotification.create({
    data: {
      id: notificationId,
      type,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdAt,
          createdBy,
          spaceId,
          userId
        }
      },
      card: { connect: { id: cardId } },
      personPropertyId
    }
  });
  log.info('Created card notification', {
    cardId,
    personPropertyId,
    notificationId: record.id,
    spaceId,
    userId,
    createdBy,
    type
  });
  return record;
}

type PollNotificationInput = NotificationInput & {
  type: VoteNotificationType;
  voteId: string;
};

export async function savePollNotification({
  type,
  createdAt,
  createdBy,
  spaceId,
  userId,
  voteId
}: PollNotificationInput) {
  const notificationId = v4();
  const record = await prisma.voteNotification.create({
    data: {
      type,
      id: notificationId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdAt,
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
  log.info('Created poll notification', {
    voteId,
    notificationId: record.id,
    spaceId,
    userId,
    createdBy,
    type
  });
  return record;
}

type CreateBountyNotificationInput = NotificationInput & {
  type: BountyNotificationType;
  bountyId: string;
  applicationId?: string;
} & (
    | {
        type: Exclude<BountyNotificationType, 'suggestion.created'>;
        applicationId: string;
      }
    | {
        type: 'suggestion.created';
      }
  );

export async function saveRewardNotification({
  type,
  createdAt,
  createdBy,
  spaceId,
  userId,
  bountyId,
  applicationId
}: CreateBountyNotificationInput) {
  const notificationId = v4();
  const record = await prisma.bountyNotification.create({
    data: {
      type,
      id: notificationId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdAt,
          createdBy,
          spaceId,
          userId
        }
      },
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
  log.info('Created reward notification', {
    bountyId,
    applicationId,
    notificationId: record.id,
    spaceId,
    userId,
    createdBy,
    type
  });
  return record;
}
