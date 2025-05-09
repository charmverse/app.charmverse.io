import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type {
  Page,
  Proposal,
  ProposalAuthor,
  ProposalEvaluationType,
  ProposalReviewer,
  ProposalRubricCriteria,
  ProposalEvaluationPermission,
  ProposalRubricCriteriaAnswer,
  DraftProposalRubricCriteriaAnswer,
  FormField
} from '@charmverse/core/prisma';
import {
  ProposalEvaluationResult,
  type ProposalAppealReviewer,
  type ProposalEvaluation,
  type ProposalEvaluationAppealReview,
  type ProposalEvaluationReview
} from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { arrayUtils } from '@charmverse/core/utilities';
import type { EASAttestationFromApi } from '@packages/credentials/external/getOnchainCredentials';
import type { ProjectAndMembersFieldConfig } from '@packages/lib/projects/formField';
import type { ProjectWithMembers } from '@packages/lib/projects/interfaces';
import { getProposalFormFields } from '@packages/lib/proposals/forms/getProposalFormFields';
import type { FormFieldInput, TypedFormField } from '@packages/lib/proposals/forms/interfaces';

import { getProposalProjectFormAnswers } from './forms/getProposalProjectFormAnswers';
import type { PopulatedEvaluation, ProposalFields, ProposalWithUsersAndRubric } from './interfaces';
import { showRubricAnswersToAuthor } from './showRubricAnswersToAuthor';

export type ProposalToMap = Proposal & {
  authors: ProposalAuthor[];
  evaluations: (ProposalEvaluation & {
    appealReviewers: ProposalAppealReviewer[];
    permissions: ProposalEvaluationPermission[];
    reviews: ProposalEvaluationReview[];
    appealReviews: ProposalEvaluationAppealReview[];
    reviewers: ProposalReviewer[];
    rubricAnswers: ProposalRubricCriteriaAnswer[];
    rubricCriteria: ProposalRubricCriteria[];
    draftRubricAnswers: DraftProposalRubricCriteriaAnswer[];
  })[];
  page: Partial<Pick<Page, 'sourceTemplateId' | 'content' | 'contentText' | 'type'>> | null;
  rewards: { id: string }[];
  form: {
    id: string;
    formFields: FormField[] | null;
  } | null;
  project?: ProjectWithMembers | null;
} & {
  issuedCredentials?: EASAttestationFromApi[];
};

export function mapDbProposalToProposal({
  proposal,
  permissionsByStep,
  workflow,
  userId
}: {
  workflow: {
    evaluations: WorkflowEvaluationJson[];
  } | null;
  proposal: ProposalToMap;
  permissionsByStep: Record<string, ProposalPermissionFlags>;
  userId?: string;
}): ProposalWithUsersAndRubric {
  const { rewards, form, evaluations, fields, page, issuedCredentials, ...rest } = proposal;

  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const permissions =
    proposal.status === 'draft'
      ? permissionsByStep.draft
      : currentEvaluation && permissionsByStep[currentEvaluation.id];
  if (!permissions) {
    throw new Error('Could not find permissions for proposal');
  }

  // find past and current evaluations for hiding form fields
  const currentEvaluationIndex = proposal.evaluations.findIndex((e) => e.id === currentEvaluation?.id);
  const formFields = getProposalFormFields({
    fields: form?.formFields as unknown as FormFieldInput[],
    canViewPrivateFields: !!permissions.view_private_fields,
    currentEvaluationIndex: proposal.status === 'draft' ? -1 : currentEvaluationIndex
  });
  const projectFormFieldConfig = proposal.form?.formFields?.find((field) => field.type === 'project_profile')
    ?.fieldConfig as ProjectAndMembersFieldConfig;
  const project = proposal.project
    ? getProposalProjectFormAnswers({
        canViewPrivateFields: !!permissions.view_private_fields,
        projectWithMembers: proposal.project,
        fieldConfig: projectFormFieldConfig
      })
    : null;

  const isAuthor = !!userId && proposal.authors.some((a) => a.userId === userId);

  const isPublicPage =
    proposal.status === 'published' && currentEvaluation?.permissions.some((p) => p.systemRole === 'public');

  const mappedEvaluations = proposal.evaluations.map((evaluation) => {
    const workflowEvaluation = workflow?.evaluations.find(
      (e) => e.title === evaluation.title && e.type === evaluation.type
    );
    const appealReviews = proposal.evaluations.flatMap((e) => e.appealReviews);
    const stepPermissions = permissionsByStep?.[evaluation.id];

    let rubricAnswers = evaluation.rubricAnswers;
    let draftRubricAnswers = evaluation.draftRubricAnswers;
    let reviews = evaluation.reviews;
    const totalReviews = evaluation.appealedAt
      ? evaluation.appealReviews.length
      : evaluation.type === 'rubric'
        ? // 1 answer per user per rubric, we care about unique respondents
          arrayUtils.uniqueValues(evaluation.rubricAnswers.map((a) => a.userId)).length
        : evaluation.reviews.length;

    const proposalFailed = currentEvaluation?.result === ProposalEvaluationResult.fail;

    if (!stepPermissions?.evaluate) {
      const showReviewsToAuthor = showRubricAnswersToAuthor({
        evaluationType: evaluation.type as ProposalEvaluationType,
        isAuthor,
        proposalFailed: !!proposalFailed,
        isCurrentEvaluationStep: evaluation.id === currentEvaluation?.id,
        showAuthorResultsOnRubricFail: !!evaluation.showAuthorResultsOnRubricFail
      });
      draftRubricAnswers = [];
      if (!evaluation.shareReviews && !showReviewsToAuthor) {
        rubricAnswers = [];
        reviews = [];
      }
    }

    return {
      ...evaluation,
      appealReviewers: evaluation.appealReviewers || [],
      reviews,
      appealReviews,
      totalReviews,
      rubricAnswers,
      draftRubricAnswers,
      declineReasonOptions: workflowEvaluation?.declineReasons ?? [],
      isReviewer: !!stepPermissions?.evaluate,
      isAppealReviewer: !!stepPermissions?.evaluate_appeal,
      isApprover: !!stepPermissions?.complete_evaluation
    } as PopulatedEvaluation;
  });
  const pageFields = page?.type === 'proposal_template' ? page : { sourceTemplateId: page?.sourceTemplateId };

  const proposalWithUsers: ProposalWithUsersAndRubric = {
    ...rest,
    project,
    page: pageFields,
    fields: fields as ProposalFields,
    evaluations: mappedEvaluations,
    permissions,
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    status: proposal.status,
    rewardIds: rewards.map((r) => r.id) || null,
    issuedCredentials: issuedCredentials || [],
    isPublic: !!isPublicPage,
    form: form
      ? {
          formFields: (formFields as TypedFormField[]) || null,
          id: form.id
        }
      : null
  };

  return proposalWithUsers;
}
