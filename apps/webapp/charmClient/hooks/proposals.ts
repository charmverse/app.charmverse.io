import type { ListProposalsRequest } from '@packages/core/proposals';
import type { EASAttestationFromApi } from '@packages/credentials/external/getOnchainCredentials';
import type { IssuableProposalCredentialContent } from '@packages/credentials/findIssuableProposalCredentials';
import type {
  ProposalBlockInput,
  ProposalBlockUpdateInput,
  ProposalBlockWithTypedFields
} from '@packages/lib/proposals/blocks/interfaces';
import type { CreateProposalInput } from '@packages/lib/proposals/createProposal';
import type { FieldAnswerInput, FormFieldInput } from '@packages/lib/proposals/forms/interfaces';
import type { ProposalWithUsersLite } from '@packages/lib/proposals/getProposals';
import type { RubricProposalsUserInfo } from '@packages/lib/proposals/getProposalsEvaluatedByUser';
import type { GetProposalsReviewersResponse } from '@packages/lib/proposals/getProposalsReviewers';
import type { ProposalTemplateMeta } from '@packages/lib/proposals/getProposalTemplates';
import type { GetUserProposalsResponse } from '@packages/lib/proposals/getUserProposals';
import type { GoBackToStepRequest } from '@packages/lib/proposals/goBackToStep';
import type { ProposalWithUsersAndRubric } from '@packages/lib/proposals/interfaces';
import type { RubricTemplate } from '@packages/lib/proposals/rubric/getRubricTemplates';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from '@packages/lib/proposals/rubric/interfaces';
import type { RubricAnswerUpsert } from '@packages/lib/proposals/rubric/upsertRubricAnswers';
import type { RubricCriteriaUpsert } from '@packages/lib/proposals/rubric/upsertRubricCriteria';
import type { AppealReviewEvaluationRequest } from '@packages/lib/proposals/submitEvaluationAppealResult';
import type { ReviewEvaluationRequest } from '@packages/lib/proposals/submitEvaluationResult';
import type { UpdateProposalRequest } from '@packages/lib/proposals/updateProposal';
import type { UpdateEvaluationRequest } from '@packages/lib/proposals/updateProposalEvaluation';

import { useCurrentSpace } from 'hooks/useCurrentSpace';

import type { MaybeString } from './helpers';
import { useDELETE, useGET, useGETImmutable, useGETtrigger, usePOST, usePUT } from './helpers';

// Getters

export function useGetProposalDetails(proposalId: MaybeString) {
  return useGET<ProposalWithUsersAndRubric>(proposalId ? `/api/proposals/${proposalId}` : null);
}

export function useGetProposalsBySpace({ spaceId }: Partial<ListProposalsRequest>) {
  return useGET<ProposalWithUsersLite[]>(spaceId ? `/api/spaces/${spaceId}/proposals` : null);
}

export function useGetProposalTemplatesBySpace(spaceId: MaybeString, detailed?: boolean) {
  return useGET<ProposalTemplateMeta[]>(spaceId ? `/api/spaces/${spaceId}/proposal-templates` : null, { detailed });
}

export function useGetProposalTemplate(pageId: MaybeString) {
  return useGET<ProposalWithUsersAndRubric>(pageId ? `/api/proposals/templates/${pageId}` : null);
}

export function useGetRubricTemplates({
  spaceId,
  excludeEvaluationId
}: {
  spaceId: MaybeString;
  excludeEvaluationId: string;
}) {
  return useGET<RubricTemplate[]>(spaceId ? `/api/proposals/rubric-templates` : null, { spaceId, excludeEvaluationId });
}

export function useGetProposalIdsEvaluatedByUser(spaceId: MaybeString) {
  return useGET<RubricProposalsUserInfo>(spaceId ? `/api/spaces/${spaceId}/proposals-evaluated-by-user` : null);
}

export function useGetProposalBlocks(spaceId?: string) {
  return useGET<ProposalBlockWithTypedFields[]>(spaceId ? `/api/spaces/${spaceId}/proposals/blocks` : null);
}

export function useGetOrCreateProposalNotesId() {
  return useGETtrigger<{ proposalId?: MaybeString; pageId?: MaybeString }, { pageId: string }>(
    `/api/proposals/reviewer-notes`
  );
}

// Mutative requests

export function useUpdateProposal({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Omit<UpdateProposalRequest, 'proposalId'>>(`/api/proposals/${proposalId}`);
}

export function usePublishProposal({ proposalId }: { proposalId: MaybeString }) {
  return usePUT(`/api/proposals/${proposalId}/publish`);
}

export function useUpdateProposalEvaluation({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Partial<Omit<UpdateEvaluationRequest, 'proposalId'>>>(`/api/proposals/${proposalId}/evaluation`);
}

export function useSubmitEvaluationReview({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Partial<Omit<ReviewEvaluationRequest, 'proposalId'>>>(`/api/proposals/${proposalId}/submit-result`);
}

export function useGoBackToStep({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Partial<Omit<GoBackToStepRequest, 'proposalId'>>>(`/api/proposals/${proposalId}/back-to-step`);
}

export function useUpsertRubricCriteria({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Pick<RubricCriteriaUpsert, 'evaluationId' | 'rubricCriteria'>>(
    `/api/proposals/${proposalId}/rubric-criteria`
  );
}
export function useUpsertRubricCriteriaAnswers({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Pick<RubricAnswerUpsert, 'evaluationId' | 'answers'>>(`/api/proposals/${proposalId}/rubric-answers`);
}

export function useUpsertDraftRubricCriteriaAnswers({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Pick<RubricAnswerUpsert, 'evaluationId' | 'answers'>>(`/api/proposals/${proposalId}/rubric-answers`);
}

export function useDeleteRubricCriteriaAnswers({ proposalId }: { proposalId: MaybeString }) {
  return useDELETE<{ isDraft: boolean; evaluationId: string }>(`/api/proposals/${proposalId}/rubric-answers`);
}

export function useUpdateProposalBlocks(spaceId: string) {
  return usePUT<(ProposalBlockUpdateInput | ProposalBlockInput)[], ProposalBlockWithTypedFields[]>(
    `/api/spaces/${spaceId}/proposals/blocks`
  );
}

export function useDeleteProposalBlocks(spaceId: string) {
  return useDELETE<string[]>(`/api/spaces/${spaceId}/proposals/blocks`);
}

export function useCreateProposalRewards(proposalId: MaybeString) {
  return usePOST<undefined, ProposalWithUsersAndRubric>(`/api/proposals/${proposalId}/rewards`);
}

export function useUpdateProposalFormFields({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<{ formFields: FormFieldInput[] }, FormFieldInput[]>(`/api/proposals/${proposalId}/form`);
}

export function useGetProposalFormFieldAnswers({ proposalId }: { proposalId: MaybeString }) {
  return useGETImmutable<FieldAnswerInput[]>(proposalId ? `/api/proposals/${proposalId}/form/answers` : null, {});
}

export function useUpdateProposalFormFieldAnswers({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<{ answers: FieldAnswerInput[] }, ProposalRubricCriteriaAnswerWithTypedResponse[]>(
    `/api/proposals/${proposalId}/form/answers`,
    // dont revalidate the request to retrieve answers on update
    { revalidate: false }
  );
}

export function useUpdateSnapshotProposal({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<{ snapshotProposalId: string | null; evaluationId: string }>(`/api/proposals/${proposalId}/snapshot`);
}

export function useUpdateTemplate({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<{ templateId: string | null }>(`/api/proposals/${proposalId}/template`);
}

export function useUpdateWorkflow({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<{ workflowId: string }>(`/api/proposals/${proposalId}/workflow`);
}

export function useArchiveProposal({ proposalId }: { proposalId: MaybeString }) {
  return usePOST<{ archived: boolean }>(`/api/proposals/${proposalId}/archive`);
}

export function useArchiveProposals() {
  return usePOST<{ archived: boolean; proposalIds: string[] }>(`/api/proposals/archive`);
}

export function useGetIssuedProposalCredentials({ proposalId }: { proposalId: MaybeString }) {
  return useGET<EASAttestationFromApi[]>(proposalId ? `/api/credentials/proposals/issued` : null, { proposalId });
}

export function useGetIssuableProposalCredentials({ proposalIds }: { proposalIds: string[] | null | undefined }) {
  const { space } = useCurrentSpace();
  return useGET<IssuableProposalCredentialContent[]>(
    space && proposalIds?.length ? `/api/credentials/proposals/issuable` : null,
    {
      spaceId: space?.id,
      proposalIds
    }
  );
}

export function useResetEvaluationReview({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<{
    evaluationId: string;
  }>(`/api/proposals/${proposalId}/reset-review`);
}

export function useAppealProposalEvaluation({ evaluationId }: { evaluationId: string }) {
  return usePUT<{ appealReason: string }>(`/api/proposals/evaluations/${evaluationId}/appeal`);
}

export function useSubmitEvaluationAppealReview({ evaluationId }: { evaluationId: string }) {
  return usePUT<Omit<AppealReviewEvaluationRequest, 'evaluationId' | 'decidedBy' | 'proposalId'>>(
    `/api/proposals/evaluations/${evaluationId}/appeal/submit-result`
  );
}

export function useResetEvaluationAppealReview({ evaluationId }: { evaluationId: string }) {
  return usePUT(`/api/proposals/evaluations/${evaluationId}/appeal/reset-review`);
}

export function useGetUserProposals(params: { spaceId: MaybeString }) {
  return useGET<GetUserProposalsResponse>(params.spaceId ? `/api/spaces/${params.spaceId}/proposals/my-work` : null);
}

export function useGetProposalsReviewers(params: { spaceId: MaybeString }) {
  return useGET<GetProposalsReviewersResponse>(
    params.spaceId ? `/api/spaces/${params.spaceId}/proposals/reviewers` : null
  );
}
