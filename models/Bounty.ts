import { BountyStatus as BountyStatusEnum, Bounty, Application } from '@prisma/client';
import { PageContent } from '.';
import { CryptoCurrency } from './Currency';

export type BountyStatus = keyof typeof BountyStatusEnum;

export const BOUNTY_STATUSES = Object.keys(BountyStatusEnum) as BountyStatus [];

export const BOUNTY_LABELS: Record<BountyStatus, string> = {
  open: 'Open',
  assigned: 'Assigned',
  review: 'Review',
  complete: 'Complete',
  paid: 'Paid'
};

export type BountyWithApplications = Bounty & {applications: Application []}
