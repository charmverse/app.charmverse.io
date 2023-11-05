import type { ApplicationStatus } from '@charmverse/core/prisma';

export const paidRewardStatuses: ApplicationStatus[] = ['paid', 'complete', 'rejected', 'processing'];
