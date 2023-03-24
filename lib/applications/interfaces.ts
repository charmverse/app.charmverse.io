import type { Application, ApplicationStatus, Bounty, PageComment, Transaction } from '@prisma/client';

import type { PageContent } from 'lib/prosemirror/interfaces';
import type { RequiredNotNull } from 'lib/utilities/types';

export interface ApplicationCreationData {
  userId: string;
  bountyId: string;
  message: string;
  status?: ApplicationStatus;
}

export interface ApplicationUpdateData {
  applicationId: string;
  message: string;
}

export interface ApplicationActionRequest {
  userId: string;
  applicationOrApplicationId: string | Application;
}

export type ReviewDecision = 'approve' | 'reject';

export interface SubmissionReview {
  submissionId: string;
  userId: string;
  decision: ReviewDecision;
}

export interface ApplicationWithBounty extends Application {
  bounty: Bounty;
}

export type SubmissionContent = RequiredNotNull<Pick<Application, 'submission' | 'submissionNodes'>> &
  Partial<Pick<Application, 'walletAddress'>>;

export interface SubmissionCreationData {
  bountyId: string;
  userId: string;
  submissionContent: SubmissionContent;
  customReward: boolean;
}

export interface SubmissionUpdateData {
  submissionId: string;
  submissionContent: Partial<SubmissionContent>;
  customReward: boolean;
}

export interface ApplicationWithTransactions extends Application {
  transactions: Transaction[];
}

export interface CreateApplicationCommentPayload {
  content: PageContent | null;
  contentText: string;
}
