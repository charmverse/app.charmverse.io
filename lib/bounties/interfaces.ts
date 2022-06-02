import { Bounty } from '@prisma/client';

export type BountyCreationData = Pick<Bounty, 'title' | 'spaceId' | 'createdBy'> & Partial<Pick<Bounty, 'status'| 'chainId'| 'description'| 'descriptionNodes'| 'approveSubmitters'| 'maxSubmissions'| 'rewardAmount'| 'rewardToken'| 'reviewer'| 'linkedTaskId'>>

export type UpdateableBountyFields = Partial<Pick<Bounty, 'title' | 'descriptionNodes' | 'description' | 'reviewer' | 'chainId' | 'rewardAmount' | 'rewardToken' | 'approveSubmitters' | 'maxSubmissions' | 'linkedTaskId'>>

export interface BountyUpdate {
  bountyId: string,
  updateContent: UpdateableBountyFields
}

export type SuggestionDecision = 'approve' | 'reject'

export interface SuggestionApproveAction {
  bountyId: string;
  decision: Extract<SuggestionDecision, 'approve'>
}
export interface SuggestionRejectAction {
  bountyId: string;
  decision: Extract<SuggestionDecision, 'reject'>
}

export type SuggestionAction = SuggestionApproveAction | SuggestionRejectAction
