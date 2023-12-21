import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalReviewer } from '@charmverse/core/prisma';
import type { FormField, Proposal } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import type { ProposalEvaluation } from '@prisma/client';

import { getOldProposalStatus } from './getOldProposalStatus';
import type { ProposalWithUsersAndRubric } from './interface';

type FormFieldsIncludeType = {
  form: {
    formFields: FormField[] | null;
  } | null;
};

export function mapDbProposalToProposal({
  proposal,
  permissions
}: {
  proposal: Proposal &
    FormFieldsIncludeType & {
      evaluations: (ProposalEvaluation & {
        reviewers: ProposalReviewer[];
        rubricAnswers: any[];
        draftRubricAnswers: any[];
      })[];
      rewards: { id: string }[];
      reviewers: ProposalReviewer[];
      rubricAnswers: any[];
      draftRubricAnswers: any[];
    };
  permissions?: ProposalPermissionFlags;
}): ProposalWithUsersAndRubric {
  const { rewards, form, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const proposalWithUsers = {
    ...rest,
    permissions,
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    evaluationType: currentEvaluation?.type || proposal.evaluationType,
    status: getOldProposalStatus(proposal),
    // Support old model: filter out evaluation-specific reviewers and rubric answers
    rubricAnswers: currentEvaluation?.rubricAnswers || proposal.rubricAnswers,
    draftRubricAnswers: currentEvaluation?.draftRubricAnswers || proposal.draftRubricAnswers,
    reviewers: currentEvaluation?.reviewers || proposal.reviewers,
    rewardIds: rewards.map((r) => r.id) || null,
    formFields: form?.formFields || null
  };

  return proposalWithUsers as ProposalWithUsersAndRubric;
}

// used for mapping data for proposal blocks/tables which dont need all the evaluation data
export function mapDbProposalToProposalLite({
  proposal,
  permissions
}: {
  proposal: ProposalWithUsers & {
    evaluations: (ProposalEvaluation & { reviewers: ProposalReviewer[] })[];
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
    reviewers: currentEvaluation?.reviewers || proposal.reviewers,
    rewardIds: rewards.map((r) => r.id) || null
  };

  return proposalWithUsers as ProposalWithUsers;
}
