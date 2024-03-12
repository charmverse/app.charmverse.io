import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import type { Application, Bounty, BountyStatus, Page, Transaction } from '@charmverse/core/prisma-client';

export type RewardReviewer = TargetPermissionGroup<'role' | 'user'>;

export type ApplicationMeta = Pick<
  Application,
  'status' | 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'walletAddress'
>;

export type RewardStatus = BountyStatus;

export type RewardType = 'token' | 'custom' | 'none';

export type Reward = Bounty;

export type RewardWithUsers = Bounty & {
  reviewers: RewardReviewer[];
  applications: ApplicationMeta[];
  allowedSubmitterRoles: string[] | null;
  assignedSubmitters: string[] | null;
};

export type RewardWithUsersAndPageMeta = Bounty & {
  reviewers: RewardReviewer[];
  applications: ApplicationMeta[];
  allowedSubmitterRoles: string[] | null;
  assignedSubmitters: string[] | null;
  page: Pick<Page, 'id' | 'title' | 'path'>;
};

export type ApplicationWithTransactions = Application & {
  transactions: Transaction[];
};

export type RewardTokenDetails = {
  chainId: number;
  rewardToken: string;
  rewardAmount: number;
};
