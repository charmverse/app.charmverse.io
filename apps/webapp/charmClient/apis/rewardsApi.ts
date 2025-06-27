import type { Application, ApplicationComment, BountyOperation, Space } from '@charmverse/core/prisma';
import * as http from '@packages/adapters/http';
import type { Resource, UserPermissionFlags } from '@packages/core/permissions';
import type { RewardCreationData } from '@packages/lib/rewards/createReward';
import type { RewardWithUsers } from '@packages/lib/rewards/interfaces';
import type { ApplicationReview } from '@packages/lib/rewards/reviewApplication';
import type { RewardUpdate } from '@packages/lib/rewards/updateRewardSettings';
import type { WorkUpsertData } from '@packages/lib/rewards/work';
import type { TransactionCreationData } from '@packages/lib/transactions/interface';

import type { CreateApplicationCommentPayload } from 'pages/api/reward-applications/comments';

export class RewardsApi {
  createReward(reward: RewardCreationData) {
    return http.POST<RewardWithUsers>('/api/rewards', reward);
  }

  updateReward({ rewardId, updateContent }: RewardUpdate): Promise<RewardWithUsers> {
    return http.PUT<RewardWithUsers>(`/api/rewards/${rewardId}`, updateContent);
  }

  listRewards(spaceId: string): Promise<RewardWithUsers[]> {
    return http.GET('/api/rewards', { spaceId });
  }

  computeRewardPermissions({ resourceId }: Resource): Promise<UserPermissionFlags<BountyOperation>> {
    return http.GET(`/api/rewards/${resourceId}/permissions`);
  }

  getReward(rewardId: string) {
    return http.GET<RewardWithUsers>(`/api/rewards/${rewardId}`);
  }

  closeReward(rewardId: string): Promise<RewardWithUsers> {
    return http.POST<RewardWithUsers>(`/api/rewards/${rewardId}/close`);
  }

  reviewApplication({ decision, applicationId }: Omit<ApplicationReview, 'userId'>): Promise<Application> {
    return http.POST<Application>(`/api/reward-applications/review?applicationId=${applicationId}`, { decision });
  }

  work(input: Omit<WorkUpsertData, 'userId'>): Promise<Application> {
    return http.PUT<Application>('/api/reward-applications/work', input);
  }

  recordTransaction(data: TransactionCreationData) {
    return http.POST('/api/transactions', data);
  }

  setPublicRewardBoard({
    publicRewardBoard,
    spaceId
  }: {
    publicRewardBoard: boolean;
    spaceId: string;
  }): Promise<Space> {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-public-bounty-board`, {
      publicRewardBoard
    });
  }

  addApplicationComment({
    applicationId,
    payload
  }: {
    applicationId: string;
    payload: CreateApplicationCommentPayload;
  }) {
    return http.POST<ApplicationComment>(`/api/reward-applications/comments?applicationId=${applicationId}`, payload);
  }

  markRewardAsPaid(rewardId: string): Promise<RewardWithUsers> {
    return http.POST<RewardWithUsers>(`/api/rewards/${rewardId}/mark-paid`);
  }

  markSubmissionAsPaid(submissionId: string) {
    return http.POST<Application>(`/api/reward-applications/mark-paid?applicationId=${submissionId}`);
  }

  deleteApplicationComment({ applicationId, commentId }: { applicationId: string; commentId: string }) {
    return http.DELETE<ApplicationComment>(
      `/api/reward-applications/comments/${commentId}?applicationId=${applicationId}`
    );
  }

  editApplicationComment({ commentId, payload }: { commentId: string; payload: CreateApplicationCommentPayload }) {
    return http.PUT<ApplicationComment>(`/api/reward-applications/comments/${commentId}`, payload);
  }

  isRewardEditable(rewardId: string) {
    return http.GET<{ editable: boolean }>(`/api/rewards/${rewardId}/is-editable-by-applicants`);
  }
}
