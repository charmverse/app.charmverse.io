import { BountyStatus, Bounty, Application, Transaction } from '@prisma/client';

export const BOUNTY_LABELS: Record<BountyStatus, string> = {
  suggestion: 'Suggestion',
  open: 'Open',
  inProgress: 'In Progress',
  complete: 'Complete',
  paid: 'Paid',
  // TODO REMOVE AFTER MIGRATION
  assigned: '-',
  review: '-'
};

export type BountyWithDetails = Bounty & {applications: Application [], transactions: Transaction []}
