export type UserEntity = {
  id: string;
  avatar: string | null;
  discordId?: string;
  wallet?: string;
  googleEmail?: string;
  username: string;
};

export type CommentEntity = {
  createdAt: string;
  id: string;
  parentId: string | null;
  threadId: string | null;
  author: UserEntity;
};

export type DiscussionEntity = {
  id: string;
  title: string;
  url: string;
  author: UserEntity;
  category: string;
};

export type ProposalEntity = {
  id: string;
  title: string;
  url: string;
  authors: UserEntity[];
};

export type BountyEntity = {
  id: string;
  title: string;
  url: string;
  rewardToken: string;
  rewardChain: string;
  rewardAmount: number;
};

export enum WebhookNameSpaceNames {
  Discussion = 'discussion',
  Comment = 'comment',
  Proposal = 'proposal',
  Bounty = 'bounty'
}

export enum WebhookEventNames {
  DiscussionCreated = 'discussion.created',
  CommentCreated = 'comment.created',
  CommentUpvoted = 'comment.upvoted',
  CommentDownvoted = 'comment.downvoted',
  ProposalPassed = 'proposal.passed',
  ProposalFailed = 'proposal.failed',
  ProposalSuggestionApproved = 'proposal.suggestion_approved',
  ProposalUserVote = 'proposal.user_voted',
  BountyCompleted = 'bounty.completed'
}

// Utils to share common props among events
type WebhookEventSharedProps<T = WebhookEventNames> = {
  scope: T;
};

// Strongly typed events, shared between API, serverless functions and possibly our end users
export type WebhookEvent<T = WebhookEventNames> =
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.DiscussionCreated;
      discussion: DiscussionEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.CommentCreated;
      comment: CommentEntity;
      discussion: DiscussionEntity | null;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.CommentUpvoted;
      comment: CommentEntity;
      discussion: DiscussionEntity;
      voter: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.CommentDownvoted;
      comment: CommentEntity;
      discussion: DiscussionEntity;
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
      scope: WebhookEventNames.ProposalUserVote;
      proposal: ProposalEntity;
      user: UserEntity;
    })
  | (WebhookEventSharedProps<T> & {
      scope: WebhookEventNames.BountyCompleted;
      bounty: BountyEntity;
      user: UserEntity;
    });

// Webhook payload being sent by out API toward theirs
export type WebhookPayload<T = WebhookEventNames> = {
  createdAt: string;
  event: WebhookEvent<T>;
  spaceId: string;
  webhookURL: string;
  signingSecret: string;
};

// Payload example
// const payload: WebhookPayload = {
//   createdAt: new Date().toISOString(),
//   event: {
//     scope: WebhookEventNames.BountyCompleted,
//     bounty,
//     user
//   }
// }
