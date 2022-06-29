import { Bounty, BountyPermission } from '@prisma/client';
import { BountyPermissions, BountySubmitter } from 'lib/permissions/bounties';
import { Roleup } from 'lib/roles/interfaces';

// Re-export bounty permissions interfaces for convenience
export * from 'lib/permissions/bounties/interfaces';

export type BountyCreationData = Pick<Bounty, 'title' | 'spaceId' | 'createdBy'> & Partial<Pick<Bounty, 'status'| 'chainId'| 'description'| 'descriptionNodes'| 'approveSubmitters'| 'maxSubmissions'| 'rewardAmount'| 'rewardToken'| 'reviewer'| 'linkedTaskId'>> & {permissions?: Partial<BountyPermissions>}

export type UpdateableBountyFields = Partial<Pick<Bounty, 'title' | 'descriptionNodes' | 'description' | 'reviewer' | 'chainId' | 'rewardAmount' | 'rewardToken' | 'approveSubmitters' | 'maxSubmissions' | 'linkedTaskId'>> & {permissions?: BountyPermissions}

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
 * @mode - whether this bounty is accessible to the space or roles
 */
export interface BountySubmitterPoolSize {
  mode: BountySubmitter
  // Breakdown of roles and members in each
  // Subset of all roles when in roles mode
  // TBC - Undefined in space mode?
  roleups: Roleup[];
  // Rollup that always exists (counts all space members, including roles, who can apply)
  total: number;
}
