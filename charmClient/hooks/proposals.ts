import type { FormFieldAnswer } from '@charmverse/core/prisma-client';
import type { ListProposalsRequest } from '@charmverse/core/proposals';

import type { FieldAnswerInput, FormFieldInput } from 'components/common/form/interfaces';
import type {
  ProposalBlockInput,
  ProposalBlockUpdateInput,
  ProposalBlockWithTypedFields
} from 'lib/proposal/blocks/interfaces';
import type { ClearEvaluationResultRequest } from 'lib/proposal/clearEvaluationResult';
import type { CreateProposalInput } from 'lib/proposal/createProposal';
import type { RubricProposalsUserInfo } from 'lib/proposal/getProposalsEvaluatedByUser';
import type { ProposalTemplate } from 'lib/proposal/getProposalTemplates';
import type { ProposalWithUsers, ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';
import type { RubricAnswerUpsert } from 'lib/proposal/rubric/upsertRubricAnswers';
import type { RubricCriteriaUpsert } from 'lib/proposal/rubric/upsertRubricCriteria';
import type { ReviewEvaluationRequest } from 'lib/proposal/submitEvaluationResult';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import type { UpdateEvaluationRequest } from 'lib/proposal/updateProposalEvaluation';
import type { UpdateProposalLensPropertiesRequest } from 'lib/proposal/updateProposalLensProperties';

import type { MaybeString } from './helpers';
import { useDELETE, useGET, usePOST, usePUT } from './helpers';

// Getters

export function useGetProposalDetails(proposalId: MaybeString) {
  return useGET<ProposalWithUsersAndRubric>(proposalId ? `/api/proposals/${proposalId}` : null);
}

export function useGetIsReviewer(proposalId: MaybeString) {
  return useGET<boolean>(proposalId ? `/api/proposals/${proposalId}/is-reviewer` : null);
}
export function useGetProposalsBySpace({ spaceId }: Partial<ListProposalsRequest>) {
  return useGET<ProposalWithUsers[]>(spaceId ? `/api/spaces/${spaceId}/proposals` : null);
}

export function useGetProposalTemplatesBySpace(spaceId: MaybeString) {
  return useGET<ProposalTemplate[]>(spaceId ? `/api/spaces/${spaceId}/proposal-templates` : null);
}

export function useGetProposalIdsEvaluatedByUser(spaceId: MaybeString) {
  return useGET<RubricProposalsUserInfo>(spaceId ? `/api/spaces/${spaceId}/proposals-evaluated-by-user` : null);
}

export function useGetProposalBlocks(spaceId?: string) {
  return useGET<ProposalBlockWithTypedFields[]>(spaceId ? `/api/spaces/${spaceId}/proposals/blocks` : null);
}

// Mutative requests

export function useCreateProposal() {
  return usePOST<Omit<CreateProposalInput, 'userId'>, { id: string }>('/api/proposals');
}

export function useUpdateProposal({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Omit<UpdateProposalRequest, 'proposalId'>>(`/api/proposals/${proposalId}`);
}

export function useUpdateProposalStatusOnly({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<{ newStatus: 'draft' | 'published' }>(`/api/proposals/${proposalId}/status-only`);
}

export function useUpdateProposalEvaluation({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Partial<Omit<UpdateEvaluationRequest, 'proposalId'>>>(`/api/proposals/${proposalId}/evaluation`);
}

export function useSubmitEvaluationResult({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Partial<Omit<ReviewEvaluationRequest, 'proposalId'>>>(`/api/proposals/${proposalId}/submit-result`);
}

export function useClearEvaluationResult({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Partial<Omit<ClearEvaluationResultRequest, 'proposalId'>>>(`/api/proposals/${proposalId}/clear-result`);
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
  return useDELETE<{ isDraft: boolean; evaluationId?: string }>(`/api/proposals/${proposalId}/rubric-answers`);
}

export function useUpdateProposalLensProperties({ proposalId }: { proposalId: string }) {
  return usePUT<Omit<UpdateProposalLensPropertiesRequest, 'proposalId'>>(
    `/api/proposals/${proposalId}/update-lens-properties`
  );
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

export function useUpdateProposalFormFields({ proposalId }: { proposalId: string }) {
  return usePUT<{ formFields: FormFieldInput[] }, FormFieldInput[]>(`/api/proposals/${proposalId}/form`);
}

export function useGetProposalFormFieldAnswers({ proposalId }: { proposalId: string }) {
  return useGET<FormFieldAnswer[]>(`/api/proposals/${proposalId}/form/answers`);
}

export function useUpdateProposalFormFieldAnswers({ proposalId }: { proposalId: string }) {
  return usePUT<{ answers: FieldAnswerInput[] }, ProposalRubricCriteriaAnswerWithTypedResponse[]>(
    `/api/proposals/${proposalId}/form/answers`
  );
}

export function useUpdateSnapshotProposal({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<{ snapshotProposalId: string | null; evaluationId: string }>(`/api/proposals/${proposalId}/snapshot`);
}
