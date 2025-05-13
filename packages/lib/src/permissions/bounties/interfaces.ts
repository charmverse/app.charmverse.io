import type { BountyOperation, BountyPermissionLevel } from '@charmverse/core/prisma';

import type { UserPermissionFlags } from '../interfaces';

export type BountyPermissionFlags = UserPermissionFlags<BountyOperation>;

// For now, we only want to write about who can submit, and who can review
export type SupportedHumanisedAccessConditions = Extract<BountyPermissionLevel, 'submitter' | 'reviewer'>;

export interface HumanisedBountyAccessSummary {
  permissionLevel: SupportedHumanisedAccessConditions;
  phrase: string;
  // Should be empty if the target permission level is accessible to the whole space
  roleNames: string[];
  // If all workspace members can perform this action, then the number is not provided, only if roles and people are selected
  totalPeople?: number;
}
