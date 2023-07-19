import type { ProposalStatus } from '@charmverse/core/prisma';

export const proposalStatusTransitionRecord: Record<ProposalStatus, ProposalStatus[]> = {
  draft: ['feedback'],
  feedback: ['draft', 'draft', 'review'],
  review: ['feedback', 'reviewed'],
  reviewed: ['vote_active', 'feedback'],
  vote_active: [],
  vote_closed: []
};

export const PROPOSAL_STATUSES = Object.keys(proposalStatusTransitionRecord) as ProposalStatus[];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Draft',
  feedback: 'feedback',
  review: 'In Review',
  reviewed: 'Reviewed',
  vote_active: 'Vote Active',
  vote_closed: 'Vote Closed'
};

export type ProposalUserGroup = 'reviewer' | 'author';

export const proposalStatusTransitionPermission: Partial<
  Record<ProposalStatus, Partial<Record<ProposalUserGroup, ProposalStatus[]>>>
> = {
  draft: {
    // Author of the proposal can move draft proposal to both draft and feedback
    // Reviewer of the proposal can't update the status of the proposal
    author: ['feedback']
  },
  feedback: {
    author: ['draft', 'review']
  },
  review: {
    author: ['feedback'],
    reviewer: ['reviewed', 'feedback']
  },
  reviewed: {
    author: ['feedback', 'vote_active']
  }
};

export const proposalStatusDetails: Record<ProposalStatus, string> = {
  draft: 'Only authors can view and edit this proposal',
  feedback: 'Space members can comment on this proposal',
  review: 'Reviewers can approve this proposal',
  reviewed: 'Authors can move this proposal to vote',
  vote_active: 'Space members are voting on this proposal',
  vote_closed: 'The vote is complete'
};
