import type {
  ProposalCategoryWithPermissions,
  ProposalFlowPermissionFlags,
  ProposalReviewerPool
} from '@charmverse/core/permissions';
import type { ProposalWithUsers, ListProposalsRequest } from '@charmverse/core/proposals';

import type { PageWithProposal } from 'lib/pages';
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
import type { UpdateProposalLensPropertiesRequest } from 'lib/proposal/updateProposalLensProperties';

import { useGET, usePOST, usePUT, useDELETE } from './helpers';

type MaybeString = string | null | undefined;

// Getters

export function useGetProposalDetails(proposalId: MaybeString) {
  return useGET<ProposalWithUsersAndRubric>(proposalId ? `/api/proposals/${proposalId}` : null);
}

export function useGetAllReviewerUserIds(proposalId: MaybeString) {
  return useGET<string[]>(proposalId ? `/api/proposals/${proposalId}/get-user-reviewerids` : null);
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
export function useGetProposalsBySpace({ spaceId, categoryIds }: Partial<ListProposalsRequest>) {
  return useGET<ProposalWithUsers[]>(spaceId ? `/api/spaces/${spaceId}/proposals` : null, { categoryIds });
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
  return usePOST<Omit<CreateProposalInput, 'userId'>, PageWithProposal>('/api/proposals');
}

export function useUpsertRubricCriteria({ proposalId }: { proposalId: string }) {
  return usePUT<Pick<RubricCriteriaUpsert, 'rubricCriteria'>>(`/api/proposals/${proposalId}/rubric-criteria`);
}

export function useUpsertRubricCriteriaAnswers({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Pick<RubricAnswerUpsert, 'answers'>>(`/api/proposals/${proposalId}/rubric-answers`);
}

export function useUpsertDraftRubricCriteriaAnswers({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Pick<RubricAnswerUpsert, 'answers'>>(`/api/proposals/${proposalId}/rubric-answers`);
}

export function useDeleteRubricCriteriaAnswers({ proposalId }: { proposalId: MaybeString }) {
  return useDELETE<{ isDraft: boolean }>(`/api/proposals/${proposalId}/rubric-answers`);
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
