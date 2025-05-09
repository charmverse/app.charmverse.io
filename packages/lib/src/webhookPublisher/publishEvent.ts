import { prisma } from '@charmverse/core/prisma-client';
import type { UserMentionMetadata } from '@packages/charmeditor/utils/extractMentions';
import type { CardPropertyEntity } from '@packages/lib/webhookPublisher/interfaces';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { trackOpUserAction } from '@packages/metrics/mixpanel/trackOpUserAction';

import {
  getApplicationCommentEntity,
  getApplicationEntity,
  getCommentEntity,
  getDocumentEntity,
  getInlineCommentEntity,
  getPostEntity,
  getProposalEntity,
  getRewardEntity,
  getSpaceEntity,
  getUserEntity,
  getVoteEntity
} from './entities';
import { publishWebhookEvent } from './publisher';

type PostEventContext = {
  scope: WebhookEventNames.ForumPostCreated;
  spaceId: string;
  postId: string;
};

export async function publishPostEvent(context: PostEventContext) {
  const [post, space] = await Promise.all([getPostEntity(context.postId), getSpaceEntity(context.spaceId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    post
  });
}

type CommentVoteEventContext = {
  scope: WebhookEventNames.ForumCommentDownvoted | WebhookEventNames.ForumCommentUpvoted;
  spaceId: string;
  postId: string;
  commentId: string;
  voterId: string;
};

export async function publishPostCommentVoteEvent(context: CommentVoteEventContext) {
  const [post, comment, space, voter] = await Promise.all([
    getPostEntity(context.postId),
    getCommentEntity(context.commentId, true),
    getSpaceEntity(context.spaceId),
    getUserEntity(context.voterId)
  ]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    comment,
    post,
    voter
  });
}

type MemberEventContext = {
  scope: WebhookEventNames.UserJoined;
  spaceId: string;
  userId: string;
};

export async function publishMemberEvent(context: MemberEventContext) {
  const [space, user] = await Promise.all([getSpaceEntity(context.spaceId), getUserEntity(context.userId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    user
  });
}

type BountyEventContext = {
  spaceId: string;
  bountyId: string;
} & (
  | {
      scope: WebhookEventNames.RewardCompleted | WebhookEventNames.RewardSuggestionCreated;
      userId: string;
    }
  | {
      scope:
        | WebhookEventNames.RewardApplicationCreated
        | WebhookEventNames.RewardApplicationApproved
        | WebhookEventNames.RewardSubmissionCreated;
      applicationId: string;
    }
  | {
      scope:
        | WebhookEventNames.RewardApplicationRejected
        | WebhookEventNames.RewardSubmissionApproved
        | WebhookEventNames.RewardApplicationPaymentCompleted;
      userId: string;
      applicationId: string;
    }
  | {
      scope: WebhookEventNames.RewardCredentialCreated;
      userId: string;
      applicationId: string;
    }
);

export async function publishBountyEvent(context: BountyEventContext) {
  const [space, bounty] = await Promise.all([getSpaceEntity(context.spaceId), getRewardEntity(context.bountyId)]);
  switch (context.scope) {
    case WebhookEventNames.RewardCompleted: {
      const user = await getUserEntity(context.userId);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        bounty,
        space,
        user
      });
    }

    case WebhookEventNames.RewardApplicationCreated:
    case WebhookEventNames.RewardSubmissionCreated:
    case WebhookEventNames.RewardApplicationApproved: {
      const application = await getApplicationEntity(context.applicationId);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        bounty,
        space,
        application
      });
    }

    case WebhookEventNames.RewardApplicationRejected:
    case WebhookEventNames.RewardSubmissionApproved:
    case WebhookEventNames.RewardApplicationPaymentCompleted:
    case WebhookEventNames.RewardCredentialCreated: {
      const [application, user] = await Promise.all([
        getApplicationEntity(context.applicationId),
        getUserEntity(context.userId)
      ]);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        bounty,
        space,
        application,
        user
      });
    }

    default: {
      return null;
    }
  }
}

type ProposalEventContext = {
  userId: string;
  spaceId: string;
  proposalId: string;
  currentEvaluationId: string;
};

export async function publishProposalEvent({ currentEvaluationId, proposalId, spaceId, userId }: ProposalEventContext) {
  const proposalEvaluations = await prisma.proposalEvaluation.findMany({
    where: {
      proposalId
    },
    orderBy: {
      index: 'asc'
    },
    select: {
      proposal: {
        select: {
          space: {
            select: {
              domain: true
            }
          }
        }
      },
      id: true,
      result: true,
      finalStep: true,
      appealable: true,
      appealedAt: true
    }
  });

  const finalEvaluation =
    proposalEvaluations.find((proposalEvaluation) => proposalEvaluation.finalStep || proposalEvaluation.appealedAt) ??
    proposalEvaluations[proposalEvaluations.length - 1];

  if (finalEvaluation.id === currentEvaluationId && finalEvaluation.result) {
    await publishProposalEventBase({
      proposalId,
      scope: finalEvaluation.result === 'fail' ? WebhookEventNames.ProposalFailed : WebhookEventNames.ProposalPassed,
      spaceId
    });

    const isOpGrantsDomain = finalEvaluation.proposal.space.domain === 'op-grants';

    if (isOpGrantsDomain) {
      if (finalEvaluation.result === 'fail') {
        trackOpUserAction('proposal_failed', {
          proposalId,
          userId
        });
      } else {
        trackOpUserAction('proposal_passed', {
          proposalId,
          userId
        });
      }
    }
  }

  await publishProposalEventBase({
    currentEvaluationId,
    proposalId,
    spaceId,
    userId,
    scope: WebhookEventNames.ProposalStatusChanged
  });
}

type ProposalEventBaseContext =
  | {
      scope: WebhookEventNames.ProposalAppealed;
      proposalId: string;
      spaceId: string;
      currentEvaluationId: string;
      userId: string;
    }
  | {
      scope: WebhookEventNames.ProposalPublished;
      proposalId: string;
      spaceId: string;
      userId: string;
    }
  | {
      scope: WebhookEventNames.ProposalPassed | WebhookEventNames.ProposalFailed;
      proposalId: string;
      spaceId: string;
    }
  | {
      userId: string;
      spaceId: string;
      proposalId: string;
      scope: WebhookEventNames.ProposalStatusChanged;
      currentEvaluationId: string;
    }
  | {
      scope: WebhookEventNames.ProposalCredentialCreated;
      proposalId: string;
      spaceId: string;
      userId: string;
    };

export async function publishProposalEventBase(context: ProposalEventBaseContext) {
  const [space, proposal] = await Promise.all([getSpaceEntity(context.spaceId), getProposalEntity(context.proposalId)]);

  switch (context.scope) {
    case WebhookEventNames.ProposalStatusChanged: {
      const user = await getUserEntity(context.userId);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        proposal,
        space,
        user,
        currentEvaluationId: context.currentEvaluationId
      });
    }
    case WebhookEventNames.ProposalPublished: {
      const user = await getUserEntity(context.userId);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        proposal,
        space,
        user
      });
    }
    case WebhookEventNames.ProposalAppealed: {
      const user = await getUserEntity(context.userId);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        proposal,
        space,
        user
      });
    }
    case WebhookEventNames.ProposalPassed:
    case WebhookEventNames.ProposalFailed: {
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        proposal,
        space
      });
    }
    case WebhookEventNames.ProposalCredentialCreated: {
      const user = await getUserEntity(context.userId);
      return publishWebhookEvent(context.spaceId, {
        scope: context.scope,
        proposal,
        space,
        user
      });
    }
    default: {
      return null;
    }
  }
}

type ProposalUserEventContext = {
  scope: WebhookEventNames.ProposalSuggestionApproved | WebhookEventNames.ProposalUserVoted;
  proposalId: string;
  spaceId: string;
  userId: string;
};

export async function publishUserProposalEvent(context: ProposalUserEventContext) {
  const [space, proposal, user] = await Promise.all([
    getSpaceEntity(context.spaceId),
    getProposalEntity(context.proposalId),
    getUserEntity(context.userId)
  ]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    proposal,
    space,
    user
  });
}

type DocumentEventContext = (
  | {
      scope: WebhookEventNames.DocumentMentionCreated;
      documentId?: string;
      mention: UserMentionMetadata;
      userId: string;
      postId?: string;
    }
  | {
      scope: WebhookEventNames.DocumentInlineCommentCreated;
      inlineCommentId: string;
      documentId: string;
    }
  | {
      scope: WebhookEventNames.DocumentCommentCreated;
      commentId: string;
      postId?: string;
      documentId?: string;
    }
  | {
      scope: WebhookEventNames.DocumentApplicationCommentCreated;
      applicationCommentId: string;
      spaceId: string;
      documentId: string;
    }
) & {
  spaceId: string;
};

export async function publishDocumentEvent(context: DocumentEventContext) {
  const space = await getSpaceEntity(context.spaceId);

  switch (context.scope) {
    case WebhookEventNames.DocumentInlineCommentCreated: {
      const document = await getDocumentEntity(context.documentId);
      const inlineComment = await getInlineCommentEntity(context.inlineCommentId);
      return publishWebhookEvent(context.spaceId, {
        scope: WebhookEventNames.DocumentInlineCommentCreated,
        document,
        space,
        inlineComment
      });
    }
    case WebhookEventNames.DocumentApplicationCommentCreated: {
      const document = await getDocumentEntity(context.documentId);
      const applicationComment = await getApplicationCommentEntity(context.applicationCommentId);
      return publishWebhookEvent(context.spaceId, {
        scope: WebhookEventNames.DocumentApplicationCommentCreated,
        document,
        space,
        applicationComment
      });
    }
    case WebhookEventNames.DocumentMentionCreated: {
      if (context.documentId) {
        const [document, user] = await Promise.all([
          getDocumentEntity(context.documentId),
          getUserEntity(context.userId)
        ]);
        return publishWebhookEvent(context.spaceId, {
          scope: WebhookEventNames.DocumentMentionCreated,
          document,
          space,
          post: null,
          user,
          mention: context.mention
        });
      } else if (context.postId) {
        const [post, user] = await Promise.all([getPostEntity(context.postId), getUserEntity(context.userId)]);
        return publishWebhookEvent(context.spaceId, {
          scope: WebhookEventNames.DocumentMentionCreated,
          post,
          document: null,
          space,
          user,
          mention: context.mention
        });
      } else {
        return null;
      }
    }
    case WebhookEventNames.DocumentCommentCreated: {
      const comment = await getCommentEntity(context.commentId, !!context.postId);
      if (context.documentId) {
        const document = await getDocumentEntity(context.documentId);
        return publishWebhookEvent(context.spaceId, {
          scope: WebhookEventNames.DocumentCommentCreated,
          document,
          post: null,
          space,
          comment
        });
      } else if (context.postId) {
        const post = await getPostEntity(context.postId);
        return publishWebhookEvent(context.spaceId, {
          scope: WebhookEventNames.DocumentCommentCreated,
          document: null,
          post,
          space,
          comment
        });
      } else {
        return null;
      }
    }
    default: {
      return null;
    }
  }
}

type VoteEventContext = {
  scope: WebhookEventNames.VoteCreated;
  voteId: string;
  spaceId: string;
};

export async function publishVoteEvent(context: VoteEventContext) {
  const [space, vote] = await Promise.all([getSpaceEntity(context.spaceId), getVoteEntity(context.voteId)]);
  return publishWebhookEvent(context.spaceId, {
    scope: context.scope,
    space,
    vote
  });
}

export type CardEventContext = {
  scope: WebhookEventNames.CardPersonPropertyAssigned;
  cardId: string;
  spaceId: string;
  cardProperty: CardPropertyEntity;
  userId: string;
};

export async function publishCardEvent(context: CardEventContext) {
  const { scope } = context;
  const [space, card] = await Promise.all([getSpaceEntity(context.spaceId), getDocumentEntity(context.cardId)]);

  switch (scope) {
    case WebhookEventNames.CardPersonPropertyAssigned: {
      const assignedUser = await getUserEntity(context.cardProperty.value);
      return publishWebhookEvent(context.spaceId, {
        scope,
        space,
        card,
        assignedUser,
        personProperty: context.cardProperty,
        user: await getUserEntity(context.userId)
      });
    }
    default: {
      return null;
    }
  }
}
