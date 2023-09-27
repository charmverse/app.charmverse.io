import type { PageType } from '@charmverse/core/dist/cjs/prisma';

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

export type BountyEntity = {
  createdAt: string;
  id: string;
  title: string;
  url: string;
  rewardToken: string | null;
  rewardChain: number | null;
  rewardAmount: number | null;
  customReward: string | null;
};

export type DocumentEntity = {
  id: string;
  title: string;
  path: string;
  type: PageType;
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

export enum WebhookNameSpaces {
  Bounty = 'bounty',
  Forum = 'forum',
  user = 'user',
  Proposal = 'proposal'
}

export enum WebhookEventNames {
  BountyCompleted = 'bounty.completed',
  CommentCreated = 'forum.comment.created',
  CommentUpvoted = 'forum.comment.upvoted',
  CommentDownvoted = 'forum.comment.downvoted',
  PostCreated = 'forum.post.created',
  ProposalPassed = 'proposal.passed',
  ProposalFailed = 'proposal.failed',
  ProposalSuggestionApproved = 'proposal.suggestion_approved',
  ProposalUserVoted = 'proposal.user_voted',
  UserJoined = 'user.joined',
  HelloWorld = 'hello.world',
  DocumentMentionCreated = 'document.mention.created',
  DocumentInlineCommentCreated = 'document.inline_comment.created',
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
type WebhookEventSharedProps<T = WebhookEventNames> = {
  scope: T;
  space: SpaceEntity;
};

// Strongly typed events, shared between API, serverless functions and possibly our end users
export type WebhookEvent<T = WebhookEventNames> =
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.PostCreated;
      post: PostEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.CommentCreated;
      comment: CommentEntity;
      post: PostEntity | null;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.CommentUpvoted;
      comment: CommentEntity;
      post: PostEntity;
      voter: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.CommentDownvoted;
      comment: CommentEntity;
      post: PostEntity;
      voter: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ProposalPassed;
      proposal: ProposalEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ProposalFailed;
      proposal: ProposalEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ProposalSuggestionApproved;
      proposal: ProposalEntity;
      user: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.ProposalUserVoted;
      proposal: ProposalEntity;
      user: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.BountyCompleted;
      bounty: BountyEntity;
      user: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.UserJoined;
      user: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.HelloWorld;
    })
  | {
      user: UserEntity;
      scope: WebhookEventNames.DocumentMentionCreated;
      document: DocumentEntity;
      space: SpaceEntity;
      mention: UserMentionMetadata;
    }
  | {
      user: UserEntity;
      scope: WebhookEventNames.DocumentInlineCommentCreated;
      space: SpaceEntity;
      document: DocumentEntity;
      inlineComment: InlineCommentEntity;
    }
  | {
      scope: WebhookEventNames.CardBlockCommentCreated;
      space: SpaceEntity;
      card: DocumentEntity;
      blockComment: BlockCommentEntity;
    }
  | {
      scope: WebhookEventNames.CardInlineCommentCreated;
      space: SpaceEntity;
      card: DocumentEntity;
      inlineComment: InlineCommentEntity;
    }
  | {
      scope: WebhookEventNames.CardPersonPropertyAssigned;
      space: SpaceEntity;
      card: DocumentEntity;
      assignedUser: UserEntity;
      personPropertyId: string;
      user: UserEntity;
    }
  | {
      scope: WebhookEventNames.CardMentionCreated;
      space: SpaceEntity;
      card: DocumentEntity;
      user: UserEntity;
      mention: UserMentionMetadata;
    };

// Webhook payload being sent by out API toward theirs
export type WebhookPayload<T = WebhookEventNames> = {
  id: string;
  createdAt: string;
  event: WebhookEvent<T>;
  spaceId: string;
  webhookURL: string | null;
  signingSecret: string | null;
};

export type WebhookEventBody<T extends WebhookEventNames> = Extract<WebhookEvent, { scope: T }>;
