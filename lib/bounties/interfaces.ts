import type { Bounty, PageType, Application } from '@prisma/client';

import type { IPageMetaWithPermissions } from 'lib/pages/interfaces';
import type { BountyPermissions } from 'lib/permissions/bounties';

// Re-export bounty permissions interfaces for convenience
export * from 'lib/permissions/bounties/interfaces';

export type BountyWithDetails = Bounty & { applications: Application[]; page: IPageMetaWithPermissions };

export type BountyCreationData = Pick<Bounty, 'spaceId' | 'createdBy'> &
  Partial<
    Pick<
      Bounty,
      'status' | 'chainId' | 'approveSubmitters' | 'maxSubmissions' | 'rewardAmount' | 'rewardToken' | 'customReward'
    >
  > & { permissions?: Partial<BountyPermissions>; pageType?: PageType; linkedPageId?: string };

export type UpdateableBountyFields = Partial<
  Pick<Bounty, 'chainId' | 'rewardAmount' | 'rewardToken' | 'approveSubmitters' | 'maxSubmissions' | 'customReward'>
> & { permissions?: Partial<BountyPermissions> };

export interface BountyUpdate {
  bountyId: string;
  updateContent: UpdateableBountyFields;
}

export type SuggestionDecision = 'approve' | 'reject';

export interface SuggestionApproveAction {
  bountyId: string;
  decision: Extract<SuggestionDecision, 'approve'>;
}
export interface SuggestionRejectAction {
  bountyId: string;
  decision: Extract<SuggestionDecision, 'reject'>;
}

export type SuggestionAction = SuggestionApproveAction | SuggestionRejectAction;

export interface BountyPagePermissionSetRequest {
  createdBy: string;
  status: string;
  spaceId: string;
  permissions: Partial<BountyPermissions> | undefined;
  linkedPageId: string | undefined;
}
