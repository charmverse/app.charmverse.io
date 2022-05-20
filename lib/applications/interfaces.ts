import { Application, Bounty } from '@prisma/client';

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

export type ReviewDecision = 'approve' | 'reject'

export interface ReviewDecisionRequest extends ApplicationActionRequest {
  decision: ReviewDecision
}

export interface ApplicationWithBounty extends Application {
  bounty: Bounty
}

export type SubmissionContent = Pick<Application, 'submission' | 'submissionNodes'>

export interface SubmissionCreationData {
  bountyId: string,
  userId: string,
  submissionContent: SubmissionContent
}

export interface SubmissionUpdateData {
  submissionId: string;
  submissionContent: SubmissionContent
}
