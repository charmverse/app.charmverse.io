import type { ApplicationStatus } from '@charmverse/core/prisma';

export const paidBountyStatuses: ApplicationStatus[] = ['paid', 'complete', 'rejected', 'processing'];
