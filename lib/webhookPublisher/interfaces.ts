import type { PageType, ProposalStatus } from '@charmverse/core/dist/cjs/prisma-client';

import type { UserMentionMetadata } from 'lib/prosemirror/extractMentions';

export type UserEntity = {
  id: string;
  avatar?: string;
  discordId?: string;
  walletAddress?: string;
  googleEmail?: string;
  username: string;
};

export type SpaceEntity = {
  avatar?: string;
  id: string;
  name: string;
  url: string;
};

export type CardEntity = {
  id: string;
  title: string;
  path: string;
  author: UserEntity;
};

export type CommentEntity = {
  createdAt: string;
  id: string;
  parentId: string | null;
  author: UserEntity;
};

export type InlineCommentEntity = {
  createdAt: string;
  id: string;
  threadId: string;
  author: UserEntity;
};

export type BlockCommentEntity = {
  createdAt: string;
  id: string;
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

export type BountyEntity = {
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
};

export type VoteEntity = {
  id: string;
  pageId: string | null;
  postId: string | null;
  title: string;
};

export type DocumentEntity = {
  id: string;
  title: string;
  path: string;
  type: PageType;
  author: UserEntity;
};

export enum WebhookNameSpaces {
  Bounty = 'bounty',
  Forum = 'forum',
  user = 'user',
  Proposal = 'proposal'
}

export enum WebhookEventNames {
  BountyCompleted = 'bounty.completed',
  BountyApplicationCreated = 'bounty.application.created',
  BountyApplicationRejected = 'bounty.application.rejected',
  BountyApplicationAccepted = 'bounty.application.accepted',
  BountyApplicationSubmitted = 'bounty.application.submitted',
  BountyApplicationPaymentCompleted = 'bounty.payment.completed',
  BountySuggestionCreated = 'bounty.suggestion.created',
  BountyApplicationApproved = 'bounty.application.approved',
  BountyInlineCommentCreated = 'bounty.inline_comment.created',
  BountyMentionCreated = 'bounty.mention.created',
  ForumCommentCreated = 'forum.comment.created',
  ForumCommentUpvoted = 'forum.comment.upvoted',
  ForumCommentDownvoted = 'forum.comment.downvoted',
  ForumPostCreated = 'forum.post.created',
  ProposalPassed = 'proposal.passed',
  ProposalFailed = 'proposal.failed',
  ProposalSuggestionApproved = 'proposal.suggestion_approved',
  ProposalUserVoted = 'proposal.user_voted',
  ProposalStatusChanged = 'proposal.status_changed',
  ProposalInlineCommentCreated = 'proposal.inline_comment.created',
  ProposalCommentCreated = 'proposal.comment.created',
  ProposalMentionCreated = 'proposal.mention.created',
  UserJoined = 'user.joined',
  HelloWorld = 'hello.world',
  DocumentMentionCreated = 'document.mention.created',
  DocumentInlineCommentCreated = 'document.inline_comment.created',
  VoteCreated = 'vote.created',
  CardMentionCreated = 'card.mention.created',
  CardInlineCommentCreated = 'card.inline_comment.created',
  CardBlockCommentCreated = 'card.block_comment.created',
  CardPersonPropertyAssigned = 'card.person_property.assigned'
}

export const whiteListedWebhookEvents = [
  'bounty.completed',
  'forum.comment.created',
  'forum.comment.upvoted',
  'forum.comment.downvoted',
  'forum.post.created',
  'proposal.passed',
  'proposal.failed',
  'proposal.suggestion_approved',
  'proposal.user_voted',
  'user.joined',
  'hello.world'
];

// Utils to share common props among events
type WebhookEventSharedProps = {
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
        scope: WebhookEventNames.ForumCommentCreated;
        comment: CommentEntity;
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
        scope: WebhookEventNames.ProposalUserVoted;
        proposal: ProposalEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.ProposalStatusChanged;
        proposal: ProposalEntity;
        newStatus: ProposalStatus;
        oldStatus: ProposalStatus | null;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.ProposalInlineCommentCreated;
        proposal: ProposalEntity;
        inlineComment: InlineCommentEntity;
      }
    | {
        scope: WebhookEventNames.ProposalCommentCreated;
        proposal: ProposalEntity;
        comment: CommentEntity;
      }
    | {
        user: UserEntity;
        scope: WebhookEventNames.ProposalMentionCreated;
        proposal: ProposalEntity;
        mention: UserMentionMetadata;
      }
    | {
        scope: WebhookEventNames.BountyCompleted;
        bounty: BountyEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.BountyApplicationCreated;
        bounty: BountyEntity;
        application: ApplicationEntity;
      }
    | {
        scope: WebhookEventNames.BountyApplicationAccepted;
        bounty: BountyEntity;
        application: ApplicationEntity;
      }
    | {
        scope: WebhookEventNames.BountyApplicationRejected;
        bounty: BountyEntity;
        application: ApplicationEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.BountyApplicationSubmitted;
        bounty: BountyEntity;
        application: ApplicationEntity;
      }
    | {
        scope: WebhookEventNames.BountyApplicationApproved;
        bounty: BountyEntity;
        application: ApplicationEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.BountyApplicationPaymentCompleted;
        bounty: BountyEntity;
        application: ApplicationEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.BountySuggestionCreated;
        bounty: BountyEntity;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.BountyInlineCommentCreated;
        bounty: BountyEntity;
        inlineComment: InlineCommentEntity;
      }
    | {
        user: UserEntity;
        scope: WebhookEventNames.BountyMentionCreated;
        bounty: BountyEntity;
        mention: UserMentionMetadata;
      }
    | {
        user: UserEntity;
        scope: WebhookEventNames.DocumentMentionCreated;
        document: DocumentEntity;
        mention: UserMentionMetadata;
      }
    | {
        user: UserEntity;
        scope: WebhookEventNames.DocumentInlineCommentCreated;
        document: DocumentEntity;
        inlineComment: InlineCommentEntity;
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
        scope: WebhookEventNames.CardBlockCommentCreated;
        space: SpaceEntity;
        card: CardEntity;
        blockComment: BlockCommentEntity;
      }
    | {
        scope: WebhookEventNames.CardInlineCommentCreated;
        space: SpaceEntity;
        card: CardEntity;
        inlineComment: InlineCommentEntity;
      }
    | {
        scope: WebhookEventNames.CardPersonPropertyAssigned;
        space: SpaceEntity;
        card: CardEntity;
        assignedUser: UserEntity;
        personPropertyId: string;
        user: UserEntity;
      }
    | {
        scope: WebhookEventNames.CardMentionCreated;
        space: SpaceEntity;
        card: CardEntity;
        user: UserEntity;
        mention: UserMentionMetadata;
      }
  );

// Webhook payload being sent by out API toward theirs
export type WebhookPayload = {
  id: string;
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
  webhookURL: string | null;
  signingSecret: string | null;
};

export type WebhookEventBody<T extends WebhookEventNames> = Extract<WebhookEvent, { scope: T }>;
