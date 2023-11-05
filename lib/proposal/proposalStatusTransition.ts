import type { ProposalEvaluationType, ProposalStatus } from '@charmverse/core/prisma';

export const proposalStatusTransitionRecord: Record<ProposalStatus, ProposalStatus[]> = {
  draft: ['discussion'],
  discussion: ['draft', 'draft', 'review', 'evaluation_active'],
  review: ['discussion', 'reviewed'],
  reviewed: ['vote_active', 'discussion'],
  vote_active: [],
  vote_closed: [],
  evaluation_active: [],
  evaluation_closed: []
};

export const PROPOSAL_STATUSES = Object.keys(proposalStatusTransitionRecord) as ProposalStatus[];

export type ProposalStatusWithArchived = ProposalStatus | 'archived';

export function getProposalStatuses(evaluationType: ProposalEvaluationType = 'vote'): ProposalStatus[] {
  if (evaluationType === 'rubric') {
    return ['draft', 'discussion', 'evaluation_active', 'evaluation_closed'];
  } else {
    return ['draft', 'discussion', 'review', 'reviewed', 'vote_active', 'vote_closed'];
  }
}

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Draft',
  discussion: 'Feedback',
  review: 'In Review',
  reviewed: 'Reviewed',
  vote_active: 'Vote Active',
  vote_closed: 'Vote Closed',
  evaluation_active: 'Evaluation Active',
  evaluation_closed: 'Evaluation Closed'
};

export const PROPOSAL_STATUS_LABELS_WITH_ARCHIVED: Record<ProposalStatusWithArchived, string> = {
  ...PROPOSAL_STATUS_LABELS,
  archived: 'Archived'
};

export type ProposalUserGroup = 'reviewer' | 'author';

export const proposalStatusTransitionPermission: Partial<
  Record<ProposalStatus, Partial<Record<ProposalUserGroup, ProposalStatus[]>>>
> = {
  draft: {
    // Author of the proposal can move draft proposal to both draft and discussion
    // Reviewer of the proposal can't update the status of the proposal
    author: ['discussion']
  },
  discussion: {
    author: ['draft', 'review']
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
  draft: 'Only authors can view and edit this proposal',
  discussion: 'Space members can comment on this proposal',
  review: 'Reviewers can approve this proposal',
  reviewed: 'Authors can move this proposal to vote',
  vote_active: 'Space members are voting on this proposal',
  vote_closed: 'The vote is complete',
  evaluation_active: 'Reviewers are evaluating this proposal',
  evaluation_closed: 'Evaluation is complete'
};

export function previousProposalStatusUpdateMessage(status: ProposalStatus) {
  switch (status) {
    case 'draft':
      return 'In the Draft stage, only authors and administrators can view and edit the proposal.';
    case 'discussion':
      return 'Rejecting this proposal will return it to the Discussion stage for further consideration.';
    case 'review':
      return 'In the Review stage, the Proposal is visible to Members. Reviewer approval is required to proceed to the voting stage.';
    default:
      return null;
  }
}

export function nextProposalStatusUpdateMessage(status: ProposalStatus) {
  switch (status) {
    case 'discussion':
      return 'In the Feedback stage, Members can view and provide feedback on the proposal.';
    case 'review':
      return 'In the Review stage, the Proposal is visible to Members. Reviewer approval is required to proceed to the voting stage.';
    case 'vote_active':
      return 'Proceeding with this action will transition the proposal into the Voting stage.';
    case 'evaluation_active':
      return 'Proceeding with this action will transition the proposal into the Evaluation stage.';
    case 'evaluation_closed':
      return 'This will close the Evaluation. No additional Rubric answers will be accepted.';
    case 'reviewed':
      return "By approving this proposal, you authorize its advancement to the voting stage. Voting is initiated by one of the proposal's authors.";
    default:
      return null;
  }
}
