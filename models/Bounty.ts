import type { Application, Bounty, BountyStatus } from '@prisma/client';
import type { IPageWithPermissions } from 'lib/pages/interfaces';

export const BOUNTY_LABELS: Record<BountyStatus, string> = {
  suggestion: 'Suggestion',
  open: 'Open',
  inProgress: 'In Progress',
  complete: 'Complete',
  paid: 'Paid'
};

export type BountyWithDetails = Bounty & { applications: Application [], page: IPageWithPermissions };
