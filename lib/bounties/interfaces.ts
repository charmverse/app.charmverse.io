import { Bounty, BountyPermission, Role } from '@prisma/client';
import { Roleup } from '../roles/interfaces';

export * from 'lib/permissions/bounties/interfaces';

export type BountyCreationData = Pick<Bounty, 'title' | 'spaceId' | 'createdBy'> & Partial<Pick<Bounty, 'status'| 'chainId'| 'description'| 'descriptionNodes'| 'approveSubmitters'| 'maxSubmissions'| 'rewardAmount'| 'rewardToken'| 'reviewer'| 'linkedTaskId'>> & {permissions: BountyPermission}

export type UpdateableBountyFields = Partial<Pick<Bounty, 'title' | 'descriptionNodes' | 'description' | 'reviewer' | 'chainId' | 'rewardAmount' | 'rewardToken' | 'approveSubmitters' | 'maxSubmissions' | 'linkedTaskId'>> & {permissions: BountyPermission}

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

/**
 * Used to represent how many potential applicants exist.
 */
export interface BountySize {
  // Total space members (including those with roles)
  space: number;
  // Breakdown of roles and members in each
  // Subset of all roles when in roles mode
  // TBC - Undefined in space mode?
  role: Roleup;
  // Rollup that always exists
  total: number;
}
