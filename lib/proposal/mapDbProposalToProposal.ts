import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type {
  FormField,
  Proposal,
  ProposalAuthor,
  ProposalReviewer,
  ProposalRubricCriteria,
  ProposalRubricCriteriaAnswer
} from '@charmverse/core/prisma';
import type { ProposalEvaluation } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import { getProposalFormFields } from 'lib/proposal/form/getProposalFormFields';

import type { ProposalFields, PopulatedEvaluation, ProposalWithUsersAndRubric, TypedFormField } from './interface';

type FormFieldsIncludeType = {
  form: {
    id: string;
    formFields: FormField[] | null;
  } | null;
};

export function mapDbProposalToProposal({
  proposal,
  permissions,
  permissionsByStep
}: {
  proposal: Proposal &
    FormFieldsIncludeType & {
      authors: ProposalAuthor[];
      evaluations: (ProposalEvaluation & {
        reviewers: ProposalReviewer[];
        rubricAnswers: ProposalRubricCriteriaAnswer[];
        rubricCriteria: ProposalRubricCriteria[];
        draftRubricAnswers: ProposalRubricCriteriaAnswer[];
      })[];
      rewards: { id: string }[];
    };
  permissions: ProposalPermissionFlags;
  permissionsByStep?: Record<string, ProposalPermissionFlags>;
}): ProposalWithUsersAndRubric {
  const { rewards, form, evaluations, fields, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const formFields = getProposalFormFields(form?.formFields, !!permissions.view_private_fields);
  const mappedEvaluations = proposal.evaluations.map((evaluation) => {
    const stepPermissions = permissionsByStep?.[evaluation.id];
    if (!stepPermissions?.evaluate) {
      evaluation.draftRubricAnswers = [];
      evaluation.rubricAnswers = [];
    }
    return {
      ...evaluation,
      isReviewer: !!stepPermissions?.evaluate
    } as unknown as PopulatedEvaluation;
  });

  const proposalWithUsers: ProposalWithUsersAndRubric = {
    ...rest,
    fields: fields as ProposalFields,
    evaluations: mappedEvaluations,
    permissions,
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    status: proposal.status,
    // reviewers: currentEvaluation?.reviewers || [],
    rewardIds: rewards.map((r) => r.id) || null,
    form: form
      ? {
          formFields: (formFields as TypedFormField[]) || null,
          id: form.id
        }
      : null
  };

  return proposalWithUsers;
}
