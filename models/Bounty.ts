import { CryptoCurrency } from './Currency';

export const BOUNTY_STATUSES = ['pending', 'in-progress', 'done'] as const;
export type BountyStatus = typeof BOUNTY_STATUSES[number];

export interface Bounty {
  id: string;
  author: string;
  createdAt: Date;
  description: object;
  reviewer: string;
  assignee: string;
  rewardAmount: number;
  rewardToken: CryptoCurrency;
  status: BountyStatus;
  title: string;
}
