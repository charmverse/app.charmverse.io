import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import type { Application, Bounty, BountyStatus, Page, Transaction } from '@charmverse/core/prisma-client';
import type { EASAttestationFromApi } from '@root/lib/credentials/external/getOnchainCredentials';
import type { IssuableRewardApplicationCredentialContent } from '@root/lib/credentials/findIssuableRewardCredentials';

export type RewardReviewer = { roleId?: string | null; userId?: string | null };

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
  lensPostLink?: string | null;
  sourceProposalPage?: {
    id: string;
    title: string;
  };
};

export type RewardWithUsersAndPageMeta = Bounty & {
  reviewers: RewardReviewer[];
  applications: ApplicationMeta[];
  allowedSubmitterRoles: string[] | null;
  assignedSubmitters: string[] | null;
  page: Pick<Page, 'id' | 'title' | 'path'>;
  sourceProposalPage?: {
    id: string;
    title: string;
  };
};

export type ApplicationWithTransactions = Application & {
  transactions: Transaction[];
  issuedCredentials: EASAttestationFromApi[];
  issuableOnchainCredentials: IssuableRewardApplicationCredentialContent[];
};

export type RewardTokenDetails = {
  chainId: number;
  rewardToken: string;
  rewardAmount: number;
};
