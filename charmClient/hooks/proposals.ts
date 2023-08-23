import type {
  ProposalCategoryWithPermissions,
  ProposalFlowPermissionFlags,
  ProposalReviewerPool
} from '@charmverse/core/permissions';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import type { PageWithProposal } from 'lib/pages';
import type { CreateProposalInput } from 'lib/proposal/createProposal';
import type { ListProposalsRequest } from 'lib/proposal/getProposalsBySpace';
import type { RubricProposalsUserInfo } from 'lib/proposal/getProposalsEvaluatedByUser';
import type { ProposalTemplate } from 'lib/proposal/getProposalTemplates';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { RubricAnswerUpsert } from 'lib/proposal/rubric/upsertRubricAnswers';
import type { RubricCriteriaUpsert } from 'lib/proposal/rubric/upsertRubricCriteria';

import { useGET, usePOST, usePUT } from './helpers';

type MaybeString = string | null | undefined;

// Getters

export function useGetProposalDetails(proposalId: MaybeString) {
  return useGET<ProposalWithUsersAndRubric>(proposalId ? `/api/proposals/${proposalId}` : null);
}

export function useGetAllReviewerUserIds(proposalId: MaybeString) {
  return useGET<string[]>(proposalId ? `/api/proposals/${proposalId}/get-user-reviewerids` : null);
}

export function useGetReviewerPool(proposalId: MaybeString) {
  return useGET<ProposalReviewerPool>(proposalId ? `/api/proposals/reviewer-pool?resourceId=${proposalId}` : null);
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

// Mutative requests

export function useCreateProposal() {
  return usePOST<Omit<CreateProposalInput, 'userId'>, PageWithProposal>('/api/proposals');
}

export function useUpsertRubricCriteria({ proposalId }: { proposalId: string }) {
  return usePUT<Pick<RubricCriteriaUpsert, 'rubricCriteria'>>(`/api/proposals/${proposalId}/rubric-criteria`);
}

export function useUpsertRubricCriteriaAnswer({ proposalId }: { proposalId: MaybeString }) {
  return usePUT<Pick<RubricAnswerUpsert, 'answers'>>(`/api/proposals/${proposalId}/rubric-answers`);
}
