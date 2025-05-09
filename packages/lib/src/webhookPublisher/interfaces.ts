import type { PageType } from '@charmverse/core/prisma';
import type { UserMentionMetadata } from '@packages/charmeditor/utils/extractMentions';

export type UserEntity = {
  id: string;
  avatar?: string;
  discordId?: string;
  walletAddress?: string;
  googleEmail?: string;
  username: string;
};

export type DocumentEntity = {
  id: string;
  title: string;
  url: string;
  type: PageType;
  authors: UserEntity[];
};

export type SpaceEntity = {
  avatar?: string;
  id: string;
  name: string;
  url: string;
};

export type CommentEntity = {
  createdAt: string;
  id: string;
  parentId: string | null;
  author: UserEntity;
};

export type PostEntity = {
  createdAt: string;
  id: string;
  title: string;
  url: string;
  author: UserEntity;
  category: { id: string; name: string };
};

export type ProposalEntity = {
  createdAt: string;
  id: string;
  title: string;
  url: string;
  authors: UserEntity[];
};

export type VoteEntity = {
  id: string;
  page: DocumentEntity | null;
  post: PostEntity | null;
  title: string;
};

export type RewardEntity = {
  createdAt: string;
  id: string;
  title: string;
  url: string;
  rewardToken: string | null;
  rewardChain: number | null;
  rewardAmount: number | null;
  customReward: string | null;
  author: UserEntity;
};

export type ApplicationEntity = {
  id: string;
  createdAt: string;
  user: UserEntity;
  bounty: RewardEntity;
};

export type InlineCommentEntity = {
  createdAt: string;
  id: string;
  threadId: string;
  author: UserEntity;
};

export type ApplicationCommentEntity = {
  createdAt: string;
  id: string;
  applicationId: string;
  author: UserEntity;
};

export type BlockCommentEntity = {
  createdAt: string;
  id: string;
  author: UserEntity;
};

export type CardPropertyEntity = {
  id: string;
  name: string;
  value: string;
};

export enum WebhookNameSpaces {
  Reward = 'bounty',
  Forum = 'forum',
  user = 'user',
  Proposal = 'proposal'
}

export enum WebhookEventNames {
  RewardCompleted = 'reward.completed',
  RewardApplicationCreated = 'reward.application.created',
  RewardApplicationRejected = 'reward.application.rejected',
  RewardApplicationApproved = 'reward.application.approved',
  RewardSubmissionCreated = 'reward.submission.created',
  RewardSubmissionApproved = 'reward.submission.approved',
  RewardApplicationPaymentCompleted = 'reward.payment.completed',
  RewardSuggestionCreated = 'reward.suggestion.created',
  RewardCredentialCreated = 'reward.credential.created',
  ForumCommentUpvoted = 'forum.comment.upvoted',
  ForumCommentDownvoted = 'forum.comment.downvoted',
  ForumPostCreated = 'forum.post.created',
  ProposalPassed = 'proposal.passed',
  ProposalFailed = 'proposal.failed',
  ProposalSuggestionApproved = 'proposal.suggestion_approved',
  ProposalUserVoted = 'proposal.user_voted',
  ProposalStatusChanged = 'proposal.status_changed',
  ProposalAppealed = 'proposal.appealed',
  ProposalPublished = 'proposal.published',
  ProposalCredentialCreated = 'proposal.credential_created',
  UserJoined = 'user.joined',
  HelloWorld = 'hello.world',
  DocumentCommentCreated = 'document.comment.created',
  DocumentInlineCommentCreated = 'document.inline_comment.created',
  DocumentMentionCreated = 'document.mention.created',
  DocumentApplicationCommentCreated = 'document.application_comment.created',
  CardPersonPropertyAssigned = 'card.person_property.assigned',
  VoteCreated = 'vote.created'
}

export const whiteListedWebhookEvents: WebhookEventNames[number][] = [
  'reward.completed',
  'forum.comment.created',
  'forum.comment.upvoted',
  'forum.comment.downvoted',
  'forum.post.created',
  'proposal.passed',
  'proposal.failed',
  'proposal.suggestion_approved',
  'proposal.appealed',
  'proposal.user_voted',
  'user.joined',
  'hello.world'
];

// Utils to share common props among events
type WebhookEventSharedProps<T = WebhookEventNames> = {
  scope: T;
  space: SpaceEntity;
};

// Strongly typed events, shared between API, serverless functions and possibly our end users
export type WebhookEvent = WebhookEventSharedProps &
  (
    | {
        scope: WebhookEventNames.ForumPostCreated;
        post: PostEntity;
      }
    | {
        scope: WebhookEventNames.ForumCommentUpvoted;
        comment: CommentEntity;
        post: PostEntity;
        voter: UserEntity;
      }
    | {
        scope: WebhookEventNames.ForumCommentDownvoted;
        comment: CommentEntity;
        post: PostEntity;
        voter: UserEntity;
      }
    | {
        scope: WebhookEventNames.ProposalPassed;
        proposal: ProposalEntity;
      }
    | {
        scope: WebhookEventNames.ProposalFailed;
        proposal: ProposalEntity;
      }
    | {
        scope: WebhookEventNames.ProposalSuggestionApproved;
        proposal: ProposalEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.ProposalAppealed;
        proposal: ProposalEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.ProposalPublished;
        proposal: ProposalEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.ProposalUserVoted;
        proposal: ProposalEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.ProposalStatusChanged;
        proposal: ProposalEntity;
        currentEvaluationId: string | null;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.ProposalCredentialCreated;
        proposal: ProposalEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.RewardCompleted;
        bounty: RewardEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.RewardApplicationCreated;
        bounty: RewardEntity;
        application: ApplicationEntity;
      }
    | {
        scope: WebhookEventNames.RewardApplicationApproved;
        bounty: RewardEntity;
        application: ApplicationEntity;
      }
    | {
        scope: WebhookEventNames.RewardApplicationRejected;
        bounty: RewardEntity;
        application: ApplicationEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.RewardSubmissionCreated;
        bounty: RewardEntity;
        application: ApplicationEntity;
      }
    | {
        scope: WebhookEventNames.RewardSubmissionApproved;
        bounty: RewardEntity;
        application: ApplicationEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.RewardApplicationPaymentCompleted;
        bounty: RewardEntity;
        application: ApplicationEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.RewardCredentialCreated;
        bounty: RewardEntity;
        application: ApplicationEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.RewardSuggestionCreated;
        bounty: RewardEntity;
        user: UserEntity;
      }
    | {
        user: UserEntity;
        scope: WebhookEventNames.DocumentMentionCreated;
        document: DocumentEntity | null;
        post: PostEntity | null;
        mention: UserMentionMetadata;
      }
    | {
        scope: WebhookEventNames.DocumentCommentCreated;
        document: DocumentEntity | null;
        post: PostEntity | null;
        comment: CommentEntity;
      }
    | {
        scope: WebhookEventNames.DocumentInlineCommentCreated;
        document: DocumentEntity;
        inlineComment: InlineCommentEntity;
      }
    | {
        scope: WebhookEventNames.DocumentApplicationCommentCreated;
        document: DocumentEntity;
        applicationComment: ApplicationCommentEntity;
      }
    | {
        scope: WebhookEventNames.UserJoined;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.HelloWorld;
      }
    | {
        scope: WebhookEventNames.VoteCreated;
        vote: VoteEntity;
      }
    | {
        scope: WebhookEventNames.CardPersonPropertyAssigned;
        space: SpaceEntity;
        card: DocumentEntity;
        assignedUser: UserEntity;
        personProperty: CardPropertyEntity;
        user: UserEntity;
      }
  );

// Webhook payload being sent by our API toward theirs
export type WebhookPayload = {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
  webhookURL: string | null;
  signingSecret: string | null;
};

export type WebhookEventBody<T extends WebhookEventNames> = Extract<WebhookEvent, { scope: T }>;
