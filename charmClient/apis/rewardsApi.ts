import type { Resource, UserPermissionFlags } from '@charmverse/core/permissions';
import type { Application, ApplicationComment, BountyOperation, Space } from '@charmverse/core/prisma';

import * as http from 'adapters/http';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import type { ReviewDecision } from 'lib/rewards/reviewApplication';
import type { RewardUpdate } from 'lib/rewards/updateRewardSettings';
import type { TransactionCreationData } from 'lib/transactions/interface';
import type { CreateApplicationCommentPayload } from 'pages/api/rewards/[id]/[applicationId]/comments';

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

  reviewApplication({
    decision,
    applicationId,
    rewardId
  }: {
    rewardId: string;
    applicationId?: string;
    decision: ReviewDecision;
  }): Promise<Application> {
    return http.POST<Application>(`/api/rewards/${rewardId}/${applicationId}/review`, { decision });
  }

  work({
    rewardId,
    applicationId,
    update
  }: {
    rewardId: string;
    applicationId?: string;
    update: Partial<Application>;
  }): Promise<Application> {
    return http.PUT<Application>(`/api/rewards/${rewardId}/work?applicationId=${applicationId}`, update);
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
    payload,
    rewardId
  }: {
    rewardId: string;
    applicationId: string;
    payload: CreateApplicationCommentPayload;
  }) {
    return http.POST<ApplicationComment>(`/api/rewards/${rewardId}/${applicationId}/comments`, payload);
  }

  deleteApplicationComment({
    applicationId,
    commentId,
    rewardId
  }: {
    rewardId: string;
    applicationId: string;
    commentId: string;
  }) {
    return http.DELETE<ApplicationComment>(`/api/rewards/${rewardId}/${applicationId}/comments/${commentId}`);
  }

  editApplicationComment({
    applicationId,
    commentId,
    payload,
    rewardId
  }: {
    rewardId: string;
    applicationId: string;
    commentId: string;
    payload: CreateApplicationCommentPayload;
  }) {
    return http.PUT<ApplicationComment>(`/api/rewards/${rewardId}/${applicationId}/comments/${commentId}`, payload);
  }

  isRewardEditable(rewardId: string) {
    return http.GET<{ editable: boolean }>(`/api/rewards/${rewardId}/is-editable-by-applicants`);
  }
}
