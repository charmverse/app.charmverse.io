import type { ProposalStatus } from '@prisma/client';

export const proposalStatusTransitionRecord: Record<ProposalStatus, ProposalStatus[]> = {
  private_draft: ['draft', 'discussion'],
  draft: ['private_draft', 'discussion'],
  discussion: ['private_draft', 'draft', 'review'],
  review: ['discussion', 'reviewed'],
  reviewed: ['vote_active', 'discussion'],
  vote_active: [],
  vote_closed: []
};

export const PROPOSAL_STATUSES = Object.keys(proposalStatusTransitionRecord) as ProposalStatus[];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  private_draft: 'Private Draft',
  draft: 'Public Draft',
  discussion: 'Discussion',
  review: 'In Review',
  reviewed: 'Reviewed',
  vote_active: 'Vote Active',
  vote_closed: 'Vote Closed'
};

export type ProposalUserGroup = 'reviewer' | 'author';

export const proposalStatusTransitionPermission: Partial<
  Record<ProposalStatus, Partial<Record<ProposalUserGroup, ProposalStatus[]>>>
> = {
  private_draft: {
    // Author of the proposal can move private_draft proposal to both draft and discussion
    // Reviewer of the proposal can't update the status of the proposal
    author: ['draft', 'discussion']
  },
  draft: {
    author: ['private_draft', 'discussion']
  },
  discussion: {
    author: ['private_draft', 'draft', 'review']
  },
  review: {
    author: ['discussion'],
    reviewer: ['reviewed', 'discussion']
  },
  reviewed: {
    author: ['discussion', 'vote_active']
  }
};

export const proposalStatusDetails: Record<ProposalStatus, string> = {
  private_draft: 'Only authors can view and edit this proposal',
  draft: 'Authors can edit and space member can view this proposal ',
  discussion: 'Space members can comment on this proposal',
  review: 'Reviewers can approve this proposal',
  reviewed: 'Authors can move this proposal to vote',
  vote_active: 'Space members are voting on this proposal',
  vote_closed: 'The vote is complete'
};
