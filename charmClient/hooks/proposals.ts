import type {
  ProposalCategoryWithPermissions,
  ProposalFlowPermissionFlags,
  ProposalPermissionsSwitch,
  ProposalReviewerPool
} from '@charmverse/core/permissions';
import type { ProposalStatus } from '@charmverse/core/prisma-client';
import type { ProposalWithUsers, ListProposalsRequest } from '@charmverse/core/proposals';

import type {
  ProposalBlockInput,
  ProposalBlockUpdateInput,
  ProposalBlockWithTypedFields
} from 'lib/proposal/blocks/interfaces';
import type { CreateProposalInput } from 'lib/proposal/createProposal';
import type { RubricProposalsUserInfo } from 'lib/proposal/getProposalsEvaluatedByUser';
import type { ProposalTemplate } from 'lib/proposal/getProposalTemplates';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { RubricAnswerUpsert } from 'lib/proposal/rubric/upsertRubricAnswers';
import type { RubricCriteriaUpsert } from 'lib/proposal/rubric/upsertRubricCriteria';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import type { UpdateEvaluationRequest } from 'lib/proposal/updateProposalEvaluation';
import type { UpdateProposalLensPropertiesRequest } from 'lib/proposal/updateProposalLensProperties';

import type { MaybeString } from './helpers';
import { useGET, usePOST, usePUT, useDELETE } from './helpers';

// Getters

export function useGetProposalDetails(proposalId: MaybeString) {
  return useGET<ProposalWithUsersAndRubric>(proposalId ? `/api/proposals/${proposalId}` : null);
}

export function useGetIsReviewer(proposalId: MaybeString) {
  return useGET<boolean>(proposalId ? `/api/proposals/${proposalId}/is-reviewer` : null);
}
export function useGetReviewerPool(categoryId: MaybeString) {
  return useGET<ProposalReviewerPool>(categoryId ? `/api/proposals/reviewer-pool?resourceId=${categoryId}` : null);
}

export function useGetProposalFlowFlags(proposalId: MaybeString) {
  return useGET<ProposalFlowPermissionFlags>(proposalId ? `/api/proposals/${proposalId}/compute-flow-flags` : null);
}
export function useGetProposalsBySpace({
  spaceId,
  categoryIds,
  useProposalEvaluationPermissions
}: Partial<ListProposalsRequest & ProposalPermissionsSwitch>) {
  return useGET<ProposalWithUsers[]>(spaceId ? `/api/spaces/${spaceId}/proposals` : null, {
    categoryIds,
    useProposalEvaluationPermissions
  });
}

export function useGetProposalTemplatesBySpace(spaceId: MaybeString) {
  return useGET<ProposalTemplate[]>(spaceId ? `/api/spaces/${spaceId}/proposal-templates` : null);
}

export function useGetProposalCategories(spaceId?: string) {
  return useGET<ProposalCategoryWithPermissions[]>(spaceId ? `/api/spaces/${spaceId}/proposal-categories` : null);
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

export function useCreateProposalRewards(proposalId: string) {
  return usePOST<undefined, ProposalWithUsersAndRubric>(`/api/proposals/${proposalId}/rewards`);
}
