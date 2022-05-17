import { Application, Bounty } from '@prisma/client';

export interface ApplicationActionRequest {
  userId: string,
  applicationOrApplicationId: string | Application
}

export type ReviewDecision = 'approve' | 'reject' | 'requestChanges'

export interface ReviewDecisionRequest extends ApplicationActionRequest {
  decision: ReviewDecision
}

export interface ApplicationWithBounty extends Application {
  bounty: Bounty
}
