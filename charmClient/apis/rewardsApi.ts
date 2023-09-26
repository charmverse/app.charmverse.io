import type { PermissionCompute, UserPermissionFlags } from '@charmverse/core/dist/cjs/permissions';
import type { Application, BountyOperation, PageComment, Space } from '@charmverse/core/prisma';

import * as http from 'adapters/http';
import type {
  ApplicationWithTransactions,
  CreateApplicationCommentPayload,
  ReviewDecision,
  SubmissionContent,
  SubmissionCreationData
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

  approveApplication(applicationId: string): Promise<Application> {
    return http.POST<Application>(`/api/applications/${applicationId}/approve`);
  }

  updateApplication(applicationId: string, update: Partial<Application>): Promise<Application> {
    return http.PUT<Application>(`/api/applications/${applicationId}`, update);
  }

  createApplication(application: Pick<Application, 'message' | 'status'> & { rewardId: string }): Promise<Application> {
    return http.POST<Application>('/api/applications', application);
  }

  listApplications(rewardId: string): Promise<ApplicationWithTransactions[]> {
    return http.GET('/api/applications', { rewardId });
  }

  createSubmission(content: Omit<SubmissionCreationData, 'userId' | 'customReward'>): Promise<Application> {
    return http.POST<Application>('/api/submissions', content);
  }

  updateSubmission({
    submissionId,
    content
  }: {
    submissionId: string;
    content: SubmissionContent;
  }): Promise<Application> {
    return http.PUT<Application>(`/api/submissions/${submissionId}`, content);
  }

  reviewSubmission(submissionId: string, decision: ReviewDecision): Promise<Application> {
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
    return http.POST<Space>(`/api/spaces/${spaceId}/set-public-reward-board`, {
      publicRewardBoard
    });
  }

  addApplicationComment(applicationId: string, payload: CreateApplicationCommentPayload) {
    return http.POST<PageComment>(`/api/applications/${applicationId}/comments`, payload);
  }

  deleteApplicationComment(applicationId: string, pageCommentId: string) {
    return http.DELETE(`/api/applications/${applicationId}/comments/${pageCommentId}`);
  }

  editApplicationComment(applicationId: string, pageCommentId: string, payload: CreateApplicationCommentPayload) {
    return http.PUT<PageComment>(`/api/applications/${applicationId}/comments/${pageCommentId}`, payload);
  }

  getApplicationComments(applicationId: string) {
    return http.GET<PageComment[]>(`/api/applications/${applicationId}/comments`);
  }

  refreshApplicationStatus(applicationId: string) {
    return http.GET<Application>(`/api/applications/${applicationId}/refresh-status`);
  }

  isRewardEditable(rewardId: string) {
    return http.GET<{ editable: boolean }>(`/api/rewards/${rewardId}/is-editable`);
  }
}
