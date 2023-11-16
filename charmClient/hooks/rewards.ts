import type { Application, ApplicationComment, PageComment } from '@charmverse/core/prisma-client';

import type { BountyPermissionFlags } from 'lib/permissions/bounties/interfaces';
import type {
  RewardBlockInput,
  RewardBlockUpdateInput,
  RewardBlockWithTypedFields
} from 'lib/rewards/blocks/interfaces';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import type { ApplicationWithTransactions, RewardWithUsers, RewardWithUsersAndPageMeta } from 'lib/rewards/interfaces';

import { useGET, usePOST, usePUT, useDELETE } from './helpers';

export function useGetRewardPermissions({ rewardId }: { rewardId?: string }) {
  return useGET<BountyPermissionFlags>(rewardId ? `/api/rewards/${rewardId}/permissions` : null);
}

export function useGetApplication({ applicationId }: { applicationId?: string }) {
  return useGET<ApplicationWithTransactions>(
    applicationId ? `/api/reward-applications/work?applicationId=${applicationId}` : null
  );
}

export function useGetApplicationComments({ applicationId }: { applicationId?: string }) {
  return useGET<ApplicationComment[]>(
    applicationId ? `/api/reward-applications/comments?applicationId=${applicationId}` : null
  );
}

export function useGetReward({ rewardId }: { rewardId?: string | null }) {
  return useGET<RewardWithUsersAndPageMeta>(rewardId ? `/api/rewards/${rewardId}` : null);
}

export function useGetRewardApplications({ rewardId }: { rewardId?: string }) {
  return useGET<Application[]>(rewardId ? `/api/rewards/${rewardId}/applications` : null);
}

export function useGetRewards({ spaceId }: { spaceId?: string }) {
  return useGET<RewardWithUsers[]>(spaceId ? `/api/rewards?spaceId=${spaceId}` : null);
}

export function useGetRewardBlocks({ spaceId }: { spaceId?: string }) {
  return useGET<RewardBlockWithTypedFields[]>(spaceId ? `/api/spaces/${spaceId}/rewards/blocks` : null);
}

// // Mutative requests

export function useCreateReward() {
  return usePOST<Omit<RewardCreationData, 'userId'>, RewardWithUsers>('/api/rewards');
}

// export function useUpsertRubricCriteria({ rewardId }: { rewardId: string }) {
//   return usePUT<Pick<RubricCriteriaUpsert, 'rubricCriteria'>>(`/api/rewards/${rewardId}/rubric-criteria`);
// }

// export function useUpsertRubricCriteriaAnswers({ rewardId }: { rewardId: MaybeString }) {
//   return usePUT<Pick<RubricAnswerUpsert, 'answers'>>(`/api/rewards/${rewardId}/rubric-answers`);
// }

// export function useUpsertDraftRubricCriteriaAnswers({ rewardId }: { rewardId: MaybeString }) {
//   return usePUT<Pick<RubricAnswerUpsert, 'answers'>>(`/api/rewards/${rewardId}/rubric-answers`);
// }

// export function useDeleteRubricCriteriaAnswers({ rewardId }: { rewardId: MaybeString }) {
//   return useDELETE<{ isDraft: boolean }>(`/api/rewards/${rewardId}/rubric-answers`);
// }

// export function useUpdateRewardLensProperties({ rewardId }: { rewardId: string }) {
//   return usePUT<Omit<UpdateRewardLensPropertiesRequest, 'rewardId'>>(`/api/rewards/${rewardId}/update-lens-properties`);
// }

export function useGetRewardTemplatesBySpace(spaceId?: string | null) {
  return useGET<RewardTemplate[]>(spaceId ? `/api/spaces/${spaceId}/reward-templates` : null);
}

export function useCreateRewardBlocks(spaceId: string) {
  return usePOST<RewardBlockInput[], RewardBlockWithTypedFields[]>(`/api/spaces/${spaceId}/rewards/blocks`);
}

export function useUpdateRewardBlocks(spaceId: string) {
  return usePUT<RewardBlockUpdateInput[], RewardBlockWithTypedFields[]>(`/api/spaces/${spaceId}/rewards/blocks`);
}

export function useDeleteRewardBlocks(spaceId: string) {
  return useDELETE<string[]>(`/api/spaces/${spaceId}/rewards/blocks`);
}
