import { Application, Bounty, BountyStatus, Page } from '@prisma/client';

export const BOUNTY_LABELS: Record<BountyStatus, string> = {
  suggestion: 'Suggestion',
  open: 'Open',
  inProgress: 'In Progress',
  complete: 'Complete',
  paid: 'Paid'
};

export type BountyWithDetails = Bounty & {applications: Application [], page: Pick<Page, 'id' | 'cardId'> | null}
