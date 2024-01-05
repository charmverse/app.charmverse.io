import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalReviewer } from '@charmverse/core/prisma';
import {
  ProposalEvaluationResult,
  type FormField,
  type Proposal,
  type ProposalEvaluation
} from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { sortBy } from 'lodash';

import { getProposalFormFields } from 'lib/proposal/form/getProposalFormFields';

import { getCurrentStep } from './getCurrentStep';
import { getOldProposalStatus } from './getProposalEvaluationStatus';
import type {
  ProposalEvaluationStep,
  ProposalFields,
  ProposalWithUsersAndRubric,
  ProposalWithUsersLite
} from './interface';

type FormFieldsIncludeType = {
  form: {
    id: string;
    formFields: FormField[] | null;
  } | null;
};

export function mapDbProposalToProposal({
  proposal,
  permissions,
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
      reviewers: ProposalReviewer[];
      rubricAnswers: any[];
      draftRubricAnswers: any[];
    };
  permissions?: ProposalPermissionFlags;
  canAccessPrivateFormFields?: boolean;
}): ProposalWithUsersAndRubric {
  const { rewards, form, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const formFields = getProposalFormFields(form?.formFields, !!canAccessPrivateFormFields);
  const fields = (rest.fields as ProposalFields) ?? null;

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
    form: form
      ? {
          formFields: formFields || null,
          id: form?.id || null
        }
      : null,
    currentStep: getCurrentStep({
      evaluations: proposal.evaluations,
      hasPendingRewards: (fields?.pendingRewards ?? []).length > 0,
      proposalStatus: proposal.status,
      hasPublishedRewards: rewards.length > 0
    })
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
    evaluationType: currentEvaluation?.type || proposal.evaluationType,
    status: getOldProposalStatus(proposal),
    reviewers: currentEvaluation?.reviewers || proposal.reviewers,
    rewardIds: rewards.map((r) => r.id) || null,
    fields
  };

  return proposalWithUsers;
}
