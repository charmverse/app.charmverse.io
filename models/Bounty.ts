import { CryptoCurrency } from './Currency';

const BOUNTY_LABELS = {
  open: 'Open',
  assigned: 'Assigned',
  review: 'Review',
  complete: 'Complete'
};

export type BountyStatus = keyof typeof BOUNTY_LABELS;

export const BOUNTY_STATUSES = Object.keys(BOUNTY_LABELS) as BountyStatus [];

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
