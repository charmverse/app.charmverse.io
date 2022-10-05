import type { Bounty, PageType, Application } from '@prisma/client';

import type { IPageWithPermissions } from 'lib/pages/interfaces';
import type { BountyPermissions, BountySubmitter } from 'lib/permissions/bounties';
import type { Roleup } from 'lib/roles/interfaces';

import type { Resource } from '../permissions/interfaces';

// Re-export bounty permissions interfaces for convenience
export * from 'lib/permissions/bounties/interfaces';

export type BountyWithDetails = Bounty & { applications: Application [], page: IPageWithPermissions };

export type BountyCreationData = Pick<Bounty, 'spaceId' | 'createdBy'>
  & Partial<Pick<Bounty, 'status'| 'chainId'| 'approveSubmitters'| 'maxSubmissions'| 'rewardAmount'| 'rewardToken'>>
  & { permissions?: Partial<BountyPermissions>, pageType?: PageType, linkedPageId?: string };

export type UpdateableBountyFields = Partial<Pick<Bounty, 'chainId' | 'rewardAmount' | 'rewardToken' | 'approveSubmitters' | 'maxSubmissions'>> & { permissions?: Partial<BountyPermissions> }

export interface BountyUpdate {
  bountyId: string;
  updateContent: UpdateableBountyFields;
}

export type SuggestionDecision = 'approve' | 'reject'

export interface SuggestionApproveAction {
  bountyId: string;
  decision: Extract<SuggestionDecision, 'approve'>;
}
export interface SuggestionRejectAction {
  bountyId: string;
  decision: Extract<SuggestionDecision, 'reject'>;
}

export type SuggestionAction = SuggestionApproveAction | SuggestionRejectAction

/**
 * Calculate pool for resource permissions as is, or pass simulated permissions to calculate pool
 */
export type BountySubmitterPoolCalculation = Partial<Resource & { permissions: Partial<BountyPermissions> }>

/**
 * Used to represent how many potential applicants exist.
 * @mode - whether this bounty is accessible to the space or roles
 */
export interface BountySubmitterPoolSize {
  mode: BountySubmitter;
  // Breakdown of roles and members in each
  // Subset of all roles when in roles mode
  // TBC - Undefined in space mode?
  roleups: Roleup[];
  // Rollup that always exists (counts all space members, including roles, who can apply)
  total: number;
}

export interface BountyPagePermissionSetRequest {
  createdBy: string;
  status: string;
  spaceId: string;
  permissions: Partial<BountyPermissions> | undefined;
  linkedPageId: string | undefined;
}
