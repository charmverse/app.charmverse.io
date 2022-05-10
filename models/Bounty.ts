import { BountyStatus, Bounty, Application, Transaction } from '@prisma/client';

export const BOUNTY_LABELS: Record<BountyStatus, string> = {
  suggestion: 'Suggestion',
  open: 'Open',
  assigned: 'Assigned',
  review: 'Review',
  complete: 'Complete',
  paid: 'Paid'
};

export type BountyWithDetails = Bounty & {applications: Application [], transactions: Transaction []}
