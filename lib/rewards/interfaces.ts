import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import type { Application, Bounty, BountyStatus, Page, Transaction } from '@charmverse/core/prisma-client';

import type { PageContent } from 'lib/prosemirror/interfaces';

export type RewardReviewer = TargetPermissionGroup<'role' | 'user'>;

export type ApplicationMeta = Pick<
  Application,
  'status' | 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'walletAddress'
>;

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

export type ApplicationWithTransactions = Application & {
  transactions: Transaction[];
};

export type UpdateableRewardFields = Partial<
  Pick<
    Reward,
    | 'chainId'
    | 'rewardAmount'
    | 'rewardToken'
    | 'approveSubmitters'
    | 'allowMultipleApplications'
    | 'maxSubmissions'
    | 'dueDate'
    | 'customReward'
    | 'fields'
  >
> & { reviewers?: RewardReviewer[]; allowedSubmitterRoles?: string[] | null };

export type RewardPageProps = Partial<
  Pick<Page, 'title' | 'content' | 'contentText' | 'sourceTemplateId' | 'headerImage' | 'icon'>
>;

export type RewardCreationData = UpdateableRewardFields & {
  pageProps?: RewardPageProps;
  linkedPageId?: string;
  spaceId: string;
  userId: string;
};

export type RewardPageAndPropertiesInput = RewardPageProps & UpdateableRewardFields & { content?: PageContent | null };
