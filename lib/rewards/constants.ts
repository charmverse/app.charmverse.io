import type { ApplicationStatus } from '@charmverse/core/prisma';

export const paidRewardStatuses: ApplicationStatus[] = ['paid', 'complete', 'rejected', 'processing'];

export const submissionStatuses: ApplicationStatus[] = [
  'submission_rejected',
  'review',
  'processing',
  'paid',
  'complete',
  'cancelled'
];
