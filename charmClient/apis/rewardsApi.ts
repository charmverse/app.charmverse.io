import type { PermissionCompute, UserPermissionFlags } from '@charmverse/core/permissions';
import type { Application, ApplicationComment, BountyOperation, Space } from '@charmverse/core/prisma';

import * as http from 'adapters/http';
import type {
  ApplicationWithTransactions,
  CreateApplicationCommentPayload,
  ReviewDecision,
  SubmissionCreationData,
  SubmissionUpdateData
} from 'lib/applications/interfaces';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import type { RewardUpdate } from 'lib/rewards/updateRewardSettings';
import type { TransactionCreationData } from 'lib/transactions/interface';

export class RewardsApi {
  createReward(reward: RewardCreationData) {
    return http.POST<RewardWithUsers>('/api/rewards', reward);
  }

  listRewards(spaceId: string, publicOnly?: boolean): Promise<RewardWithUsers[]> {
    return http.GET('/api/rewards', { spaceId, publicOnly });
  }

  /**
   * Get full set of permissions for a specific user on a certain page
   *
   * TODO - Replace inline permissions by permission flags in final location
   */
  computePermissions({ resourceId, userId }: PermissionCompute): Promise<UserPermissionFlags<BountyOperation>> {
    return http.GET(`/api/rewards/${resourceId}/permissions?userId=${userId}`);
  }

  getReward(rewardId: string) {
    return http.GET<RewardWithUsers>(`/api/rewards/${rewardId}`);
  }

  updateReward({ rewardId, updateContent }: RewardUpdate): Promise<RewardWithUsers> {
    return http.PUT<RewardWithUsers>(`/api/rewards/${rewardId}`, updateContent);
  }

  lockSubmissions(rewardId: string, lock?: boolean): Promise<RewardWithUsers> {
    return http.POST<RewardWithUsers>(`/api/rewards/${rewardId}/lock?lock=${lock ?? true}`);
  }

  closeReward(rewardId: string): Promise<RewardWithUsers> {
    return http.POST<RewardWithUsers>(`/api/rewards/${rewardId}/close`);
  }

  markRewardAsPaid(rewardId: string): Promise<RewardWithUsers> {
    return http.POST<RewardWithUsers>(`/api/rewards/${rewardId}/mark-paid`);
  }

  reviewApplication({
    decision,
    applicationId
  }: {
    applicationId: string;
    decision: ReviewDecision;
  }): Promise<Application> {
    return http.POST<Application>(`/api/applications/${applicationId}/v2/review`, { decision });
  }

  updateApplication({
    applicationId,
    update
  }: {
    applicationId: string;
    update: Partial<Application>;
  }): Promise<Application> {
    return http.PUT<Application>(`/api/applications/${applicationId}`, update);
  }

  createApplication(application: Pick<Application, 'message'> & { bountyId: string }): Promise<Application> {
    return http.POST<Application>('/api/applications', application);
  }

  listApplications(rewardId: string): Promise<ApplicationWithTransactions[]> {
    return http.GET('/api/applications', { rewardId });
  }

  createSubmission(content: Omit<SubmissionCreationData, 'userId' | 'customReward'>): Promise<Application> {
    return http.POST<Application>('/api/submissions', content);
  }

  updateSubmission({ submissionId, submissionContent }: SubmissionUpdateData): Promise<Application> {
    return http.PUT<Application>(`/api/submissions/${submissionId}`, { content: submissionContent });
  }

  reviewSubmission({
    decision,
    submissionId
  }: {
    submissionId: string;
    decision: ReviewDecision;
  }): Promise<Application> {
    return http.POST<Application>(`/api/submissions/${submissionId}/review`, {
      decision
    });
  }

  markSubmissionAsPaid(submissionId: string) {
    return http.POST<Application>(`/api/submissions/${submissionId}/mark-as-paid`);
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
    return http.POST<ApplicationComment>(`/api/applications/${applicationId}/comments/v2`, payload);
  }

  deleteApplicationComment({ applicationId, commentId }: { applicationId: string; commentId: string }) {
    return http.DELETE<ApplicationComment>(`/api/applications/${applicationId}/comments/v2/${commentId}`);
  }

  editApplicationComment({
    applicationId,
    commentId,
    payload
  }: {
    applicationId: string;
    commentId: string;
    payload: CreateApplicationCommentPayload;
  }) {
    return http.PUT<ApplicationComment>(`/api/applications/${applicationId}/comments/v2/${commentId}`, payload);
  }

  refreshApplicationStatus(applicationId: string) {
    return http.GET<Application>(`/api/applications/${applicationId}/refresh-status`);
  }

  isRewardEditable(rewardId: string) {
    return http.GET<{ editable: boolean }>(`/api/rewards/${rewardId}/is-editable-by-applicants`);
  }
}
