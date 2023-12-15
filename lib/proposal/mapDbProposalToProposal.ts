import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type { Proposal, ProposalAuthor, ProposalCategory } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import type { ProposalEvaluation } from '@prisma/client';

import { getOldProposalStatus } from './getOldProposalStatus';
import type { ProposalWithUsersAndRubric } from './interface';

export function mapDbProposalToProposal({
  proposal,
  permissions
}: {
  proposal: Proposal & {
    evaluations: ProposalEvaluation[];
    rewards: { id: string }[];
    reviewers: { evaluationId: string | null }[];
    rubricAnswers: { evaluationId: string | null }[];
    draftRubricAnswers: { evaluationId: string | null }[];
  };
  permissions?: ProposalPermissionFlags;
}): ProposalWithUsersAndRubric {
  const { rewards, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const proposalWithUsers = {
    ...rest,
    permissions,
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    evaluationType: currentEvaluation?.type || proposal.evaluationType,
    status: getOldProposalStatus(proposal),
    // Support old model: filter out evaluation-specific reviewers and rubric answers
    rubricAnswers: proposal.rubricAnswers.filter((answer) => !answer.evaluationId),
    draftRubricAnswers: proposal.draftRubricAnswers.filter((answer) => !answer.evaluationId),
    reviewers: proposal.reviewers.filter((reviewer) => !reviewer.evaluationId),
    rewardIds: rewards.map((r) => r.id) || null
  };

  return proposalWithUsers as ProposalWithUsersAndRubric;
}

// used for mapping data for proposal blocks/tables which dont need all the evaluation data
export function mapDbProposalToProposalLite({
  proposal,
  permissions
}: {
  proposal: ProposalWithUsers & {
    evaluations: ProposalEvaluation[];
    rewards: { id: string }[];
  };
  permissions?: ProposalPermissionFlags;
}): ProposalWithUsers {
  const { rewards, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const evaluationWithOldType = proposal.evaluations.find((e) => e.type === 'rubric' || e.type === 'vote');
  const proposalWithUsers = {
    ...rest,
    permissions,
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    evaluationType: evaluationWithOldType?.type || proposal.evaluationType,
    status: getOldProposalStatus(proposal),
    reviewers: proposal.reviewers.filter((reviewer) => !reviewer.evaluationId),
    rewardIds: rewards.map((r) => r.id) || null
  };

  return proposalWithUsers as ProposalWithUsers;
}
