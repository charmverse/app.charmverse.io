import type { Application, PageComment, Space } from '@charmverse/core/dist/prisma';

import * as http from 'adapters/http';
import type {
  ApplicationWithTransactions,
  CreateApplicationCommentPayload,
  ReviewDecision,
  SubmissionContent,
  SubmissionCreationData
} from 'lib/applications/interfaces';
import type {
  AssignedBountyPermissions,
  BountyCreationData,
  BountyUpdate,
  SuggestionAction,
  BountyWithDetails
} from 'lib/bounties';
import type { Resource } from 'lib/permissions/interfaces';
import type { PublicBountyToggle } from 'lib/spaces/interfaces';
import type { TransactionCreationData } from 'lib/transactions/interface';

export class BountiesApi {
  createBounty(bounty: Partial<BountyCreationData>) {
    return http.POST<BountyWithDetails>('/api/bounties', bounty);
  }

  listBounties(spaceId: string, publicOnly?: boolean): Promise<BountyWithDetails[]> {
    return http.GET('/api/bounties', { spaceId, publicOnly });
  }

  /**
   * Get full set of permissions for a specific user on a certain page
   */
  computePermissions({ resourceId }: Resource): Promise<AssignedBountyPermissions> {
    return http.GET(`/api/bounties/${resourceId}/permissions`);
  }

  reviewSuggestion({ bountyId, decision }: SuggestionAction): Promise<BountyWithDetails | { success: true }> {
    return http.POST<BountyWithDetails>(`/api/bounties/${bountyId}/review-suggestion`, { decision });
  }

  getBounty(bountyId: string): Promise<BountyWithDetails> {
    return http.GET<BountyWithDetails>(`/api/bounties/${bountyId}`);
  }

  updateBounty({ bountyId, updateContent }: BountyUpdate): Promise<BountyWithDetails> {
    return http.PUT<BountyWithDetails>(`/api/bounties/${bountyId}`, updateContent);
  }

  lockSubmissions(bountyId: string, lock?: boolean): Promise<BountyWithDetails> {
    return http.POST<BountyWithDetails>(`/api/bounties/${bountyId}/lock?lock=${lock ?? true}`);
  }

  closeBounty(bountyId: string): Promise<BountyWithDetails> {
    return http.POST<BountyWithDetails>(`/api/bounties/${bountyId}/close`);
  }

  markBountyAsPaid(bountyId: string): Promise<BountyWithDetails> {
    return http.POST<BountyWithDetails>(`/api/bounties/${bountyId}/mark-paid`);
  }

  approveApplication(applicationId: string): Promise<Application> {
    return http.POST<Application>(`/api/applications/${applicationId}/approve`);
  }

  updateApplication(applicationId: string, update: Partial<Application>): Promise<Application> {
    return http.PUT<Application>(`/api/applications/${applicationId}`, update);
  }

  createApplication(application: Pick<Application, 'bountyId' | 'message' | 'status'>): Promise<Application> {
    return http.POST<Application>('/api/applications', application);
  }

  listApplications(bountyId: string): Promise<ApplicationWithTransactions[]> {
    return http.GET('/api/applications', { bountyId });
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

  recordTransaction(data: TransactionCreationData & { isMultisig?: boolean }) {
    return http.POST('/api/transactions', data);
  }

  setPublicBountyBoard({ publicBountyBoard, spaceId }: PublicBountyToggle): Promise<Space> {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-public-bounty-board`, {
      publicBountyBoard
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
    return http.GET<PageComment[]>(`/api/applications/${applicationId}/refresh-status`);
  }
}
