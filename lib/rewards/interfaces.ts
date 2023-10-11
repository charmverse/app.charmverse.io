import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import type { Bounty, User, Application, BountyStatus } from '@charmverse/core/prisma-client';

export type RewardReviewer = TargetPermissionGroup<'role' | 'user'>;

export type ApplicationMeta = Pick<Application, 'status' | 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;

export type RewardStatus = BountyStatus;

export type Reward = Bounty;

export type RewardWithUsers = Bounty & {
  reviewers: RewardReviewer[];
  applications: ApplicationMeta[];
  allowedSubmitterRoles: string[] | null;
};
