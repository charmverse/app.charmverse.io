import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import type { Bounty, User, Application, BountyStatus, Page } from '@charmverse/core/prisma-client';

export type RewardReviewer = TargetPermissionGroup<'role' | 'user'>;

export type ApplicationMeta = Pick<Application, 'status' | 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;

export type RewardStatus = BountyStatus;

export type Reward = Bounty;

export type RewardWithUsers = Bounty & {
  reviewers: RewardReviewer[];
  applications: ApplicationMeta[];
  allowedSubmitterRoles: string[] | null;
};

export type RewardWithUsersAndPageMeta = Bounty & {
  reviewers: RewardReviewer[];
  applications: ApplicationMeta[];
  allowedSubmitterRoles: string[] | null;
  page: Pick<Page, 'id' | 'title' | 'path'>;
};
