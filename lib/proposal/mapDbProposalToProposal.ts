import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalReviewer } from '@charmverse/core/prisma';
import { type FormField, type Proposal, type ProposalEvaluation } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { sortBy } from 'lodash';

import { getProposalFormFields } from 'lib/proposal/form/getProposalFormFields';

import { getCurrentStep } from './getCurrentStep';
// import { getOldProposalStatus } from './getProposalEvaluationStatus';
import type { ProposalFields, ProposalWithUsersAndRubric, ProposalWithUsersLite } from './interface';

type FormFieldsIncludeType = {
  form: {
    id: string;
    formFields: FormField[] | null;
  } | null;
};

export function mapDbProposalToProposal({
  proposal,
  permissions,
  permissionsByStep,
  canAccessPrivateFormFields
}: {
  proposal: Proposal &
    FormFieldsIncludeType & {
      evaluations: (ProposalEvaluation & {
        reviewers: ProposalReviewer[];
        rubricAnswers: any[];
        draftRubricAnswers: any[];
      })[];
      rewards: { id: string }[];
    };
  permissions?: ProposalPermissionFlags;
  permissionsByStep?: Record<string, ProposalPermissionFlags>;
  canAccessPrivateFormFields?: boolean;
}): ProposalWithUsersAndRubric {
  const { rewards, form, evaluations, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const formFields = getProposalFormFields(form?.formFields, !!canAccessPrivateFormFields);
  //   const fields = (rest.fields as ProposalFields) ?? null;
  const mappedEvaluations = proposal.evaluations.map((evaluation) => {
    const stepPermissions = permissionsByStep?.[evaluation.id];
    if (!stepPermissions?.evaluate) {
      evaluation.draftRubricAnswers = [];
      evaluation.rubricAnswers = [];
    }
    return {
      ...evaluation,
      isReviewer: !!stepPermissions?.evaluate
    };
  });

  const proposalWithUsers = {
    ...rest,
    evaluations: mappedEvaluations,
    permissions,
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    status: proposal.status,
    // reviewers: currentEvaluation?.reviewers || [],
    rewardIds: rewards.map((r) => r.id) || null,
    form: form
      ? {
          formFields: formFields || null,
          id: form?.id || null
        }
      : null
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
}): ProposalWithUsersLite {
  const { rewards, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const fields = (rest.fields as ProposalFields) ?? null;

  const proposalWithUsers = {
    ...rest,
    evaluations: sortBy(proposal.evaluations, 'index').map((e) => ({
      title: e.title,
      index: e.index,
      type: e.type,
      result: e.result,
      id: e.id
    })),
    permissions,
    currentStep: getCurrentStep({
      evaluations: proposal.evaluations,
      hasPendingRewards: (fields?.pendingRewards ?? []).length > 0,
      proposalStatus: proposal.status,
      hasPublishedRewards: rewards.length > 0
    }),
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    status: proposal.status,
    reviewers: currentEvaluation?.reviewers || proposal.reviewers,
    rewardIds: rewards.map((r) => r.id) || null,
    fields
  };

  return proposalWithUsers;
}
