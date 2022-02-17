import { PageContent } from '.';
import { CryptoCurrency } from './Currency';

export const BOUNTY_LABELS = {
  open: 'Open',
  assigned: 'Assigned',
  review: 'Review',
  complete: 'Complete',
  paid: 'Paid'
};

export type BountyStatus = keyof typeof BOUNTY_LABELS;

export const BOUNTY_STATUSES = Object.keys(BOUNTY_LABELS) as BountyStatus [];

export interface Bounty {
  id: string;
  author: string;
  createdAt: Date;
  description: string;
  descriptionNodes: PageContent;
  reviewer: string;
  assignee: string;
  rewardAmount: number;
  rewardToken: CryptoCurrency;
  status: BountyStatus;
  title: string;
  linkedTaskId: string;
}
