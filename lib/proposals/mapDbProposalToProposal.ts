import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type {
  FormField,
  Page,
  Proposal,
  ProposalAuthor,
  ProposalReviewer,
  ProposalRubricCriteria,
  ProposalRubricCriteriaAnswer
} from '@charmverse/core/prisma';
import type {
  ProposalAppealReviewer,
  ProposalEvaluation,
  ProposalEvaluationAppealReview,
  ProposalEvaluationReview
} from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { arrayUtils } from '@charmverse/core/utilities';
import type { EASAttestationFromApi } from '@root/lib/credentials/external/getOnchainCredentials';
import type { FormFieldInput } from '@root/lib/forms/interfaces';
import type { ProjectAndMembersFieldConfig } from '@root/lib/projects/formField';
import type { ProjectWithMembers } from '@root/lib/projects/interfaces';
import { getProposalFormFields } from '@root/lib/proposals/form/getProposalFormFields';

import { getProposalProjectFormAnswers } from './form/getProposalProjectFormAnswers';
import type { PopulatedEvaluation, ProposalFields, ProposalWithUsersAndRubric, TypedFormField } from './interfaces';

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
  proposalEvaluationReviews,
  workflow,
  proposalEvaluationAppealReviews,
  isPublicPage
}: {
  workflow: {
    evaluations: WorkflowEvaluationJson[];
  } | null;
  isPublicPage?: boolean;
  proposalEvaluationReviews?: ProposalEvaluationReview[];
  proposalEvaluationAppealReviews?: ProposalEvaluationAppealReview[];
  proposal: Proposal &
    FormFieldsIncludeType & {
      authors: ProposalAuthor[];
      evaluations: (ProposalEvaluation & {
        appealReviewers: ProposalAppealReviewer[];
        reviews: ProposalEvaluationReview[];
        appealReviews: ProposalEvaluationAppealReview[];
        reviewers: ProposalReviewer[];
        rubricAnswers: ProposalRubricCriteriaAnswer[];
        rubricCriteria: ProposalRubricCriteria[];
        draftRubricAnswers: ProposalRubricCriteriaAnswer[];
      })[];
      page: Partial<Pick<Page, 'sourceTemplateId' | 'content' | 'contentText' | 'type'>> | null;
      rewards: { id: string }[];
      project?: ProjectWithMembers | null;
    } & {
      issuedCredentials?: EASAttestationFromApi[];
    };
  permissions: ProposalPermissionFlags;
  permissionsByStep?: Record<string, ProposalPermissionFlags>;
}): ProposalWithUsersAndRubric {
  const { rewards, form, evaluations, fields, page, issuedCredentials, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const formFields = getProposalFormFields(
    form?.formFields as unknown as FormFieldInput[],
    !!permissions.view_private_fields
  );
  const projectFormFieldConfig = proposal.form?.formFields?.find((field) => field.type === 'project_profile')
    ?.fieldConfig as ProjectAndMembersFieldConfig;
  const project = proposal.project
    ? getProposalProjectFormAnswers({
        canViewPrivateFields: !!permissions.view_private_fields,
        projectWithMembers: proposal.project,
        fieldConfig: projectFormFieldConfig
      })
    : null;

  const mappedEvaluations = proposal.evaluations.map((evaluation) => {
    const workflowEvaluation = workflow?.evaluations.find(
      (e) => e.title === evaluation.title && e.type === evaluation.type
    );
    const appealReviews = proposalEvaluationAppealReviews?.filter((review) => review.evaluationId === evaluation.id);
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

    if (!stepPermissions?.evaluate) {
      draftRubricAnswers = [];
      if (!evaluation.shareReviews) {
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
