import { Application, Bounty, Transaction } from '@prisma/client';

export interface ApplicationCreationData {
  userId: string,
  bountyId: string,
  message: string
}

export interface ApplicationUpdateData {
  applicationId: string
  message: string
}

export interface ApplicationActionRequest {
  userId: string,
  applicationOrApplicationId: string | Application
}

export type ReviewDecision = 'approve' | 'reject' | 'pay'

export interface SubmissionReview {
  submissionId: string
  decision: ReviewDecision
}

export interface ApplicationWithBounty extends Application {
  bounty: Bounty
}

export type SubmissionContent = Partial<Pick<Application, 'submission' | 'submissionNodes' | 'walletAddress'>>

export interface SubmissionCreationData {
  bountyId: string,
  userId: string,
  submissionContent: SubmissionContent
}

export interface SubmissionUpdateData {
  submissionId: string;
  submissionContent: SubmissionContent
}

export interface ApplicationWithTransactions extends Application {
  transactions: Transaction[]
}
