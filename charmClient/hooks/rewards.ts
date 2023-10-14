// import type {
//   RewardCategoryWithPermissions,
//   RewardFlowPermissionFlags,
//   RewardReviewerPool
// } from '@charmverse/core/permissions';
// import type { RewardWithUsers, ListRewardsRequest } from '@charmverse/core/rewards';

// import type { PageWithReward } from 'lib/pages';
import type { Application, ApplicationComment, PageComment } from '@charmverse/core/prisma-client';

import type { BountyPermissionFlags } from 'lib/permissions/bounties/interfaces';
import type {
  RewardBlockInput,
  RewardBlockUpdateInput,
  RewardBlockWithTypedFields
} from 'lib/rewards/blocks/interfaces';
// import type { CreateRewardInput } from 'lib/rewards/createReward';
// import type { RubricRewardsUserInfo } from 'lib/rewards/getRewardsEvaluatedByUser';
// import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
// import type { RewardWithUsersAndRubric } from 'lib/rewards/interface';
// import type { RubricAnswerUpsert } from 'lib/rewards/rubric/upsertRubricAnswers';
// import type { RubricCriteriaUpsert } from 'lib/rewards/rubric/upsertRubricCriteria';
// import type { UpdateRewardLensPropertiesRequest } from 'lib/rewards/updateRewardLensProperties';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardWithUsers, RewardWithUsersAndPageMeta } from 'lib/rewards/interfaces';

import { useGET, usePOST, usePUT, useDELETE } from './helpers';

type MaybeString = string | null | undefined;

// Getters

// export function useGetRewardDetails(rewardId: MaybeString) {
//   return useGET<RewardWithUsersAndRubric>(rewardId ? `/api/rewards/${rewardId}` : null);
// }

// export function useGetAllReviewerUserIds(rewardId: MaybeString) {
//   return useGET<string[]>(rewardId ? `/api/rewards/${rewardId}/get-user-reviewerids` : null);
// }

// export function useGetReviewerPool(categoryId: MaybeString) {
//   return useGET<RewardReviewerPool>(categoryId ? `/api/rewards/reviewer-pool?resourceId=${categoryId}` : null);
// }

// export function useGetRewardFlowFlags(rewardId: MaybeString) {
//   return useGET<RewardFlowPermissionFlags>(rewardId ? `/api/rewards/${rewardId}/compute-flow-flags` : null);
// }
// export function useGetRewardsBySpace({ spaceId, categoryIds }: Partial<ListRewardsRequest>) {
//   return useGET<RewardWithUsers[]>(spaceId ? `/api/spaces/${spaceId}/rewards` : null, { categoryIds });
// }

// // export function useGetRewardTemplatesBySpace(spaceId: MaybeString) {
// //   return useGET<RewardTemplate[]>(spaceId ? `/api/spaces/${spaceId}/reward-templates` : null);
// // }

// // export function useGetRewardCategories(spaceId?: string) {
// //   return useGET<RewardCategoryWithPermissions[]>(spaceId ? `/api/spaces/${spaceId}/reward-categories` : null);
// // }

// export function useGetRewardIdsEvaluatedByUser(spaceId: MaybeString) {
//   return useGET<RubricRewardsUserInfo>(spaceId ? `/api/spaces/${spaceId}/rewards-evaluated-by-user` : null);
// }

export function useGetRewardPermissions({ rewardId }: { rewardId?: string }) {
  return useGET<BountyPermissionFlags>(rewardId ? `/api/rewards/${rewardId}/permissions` : null);
}

export function useGetApplication({ applicationId }: { applicationId?: string }) {
  return useGET<Application>(applicationId ? `/api/reward-applications/work?${applicationId}` : null);
}

export function useGetApplicationComments({ applicationId }: { applicationId?: string }) {
  return useGET<ApplicationComment[]>(applicationId ? `/api/applications/${applicationId}/comments/v2` : null);
}

export function useGetReward({ rewardId }: { rewardId?: string }) {
  return useGET<RewardWithUsersAndPageMeta>(rewardId ? `/api/rewards/${rewardId}` : null);
}

export function useGetRewardApplications({ rewardId }: { rewardId?: string }) {
  return useGET<Application[]>(rewardId ? `/api/rewards/${rewardId}/applications` : null);
}

export function useGetRewards({ spaceId }: { spaceId?: string }) {
  return useGET<RewardWithUsers[]>(spaceId ? `/api/spaces/${spaceId}/rewards` : null);
}

export function useGetRewardBlocks({ spaceId }: { spaceId?: string }) {
  return useGET<RewardBlockWithTypedFields[]>(spaceId ? `/api/spaces/${spaceId}/rewards/blocks` : null);
}

// // Mutative requests

export function useCreateReward() {
  return usePOST<RewardCreationData, RewardWithUsers>('/api/rewards');
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

export function useCreateRewardBlocks(spaceId: string) {
  return usePOST<RewardBlockInput[], RewardBlockWithTypedFields[]>(`/api/spaces/${spaceId}/rewards/blocks`);
}

export function useUpdateRewardBlocks(spaceId: string) {
  return usePUT<RewardBlockUpdateInput[], RewardBlockWithTypedFields[]>(`/api/spaces/${spaceId}/rewards/blocks`);
}

export function useDeleteRewardBlocks(spaceId: string) {
  return useDELETE<string[]>(`/api/spaces/${spaceId}/rewards/blocks`);
}
