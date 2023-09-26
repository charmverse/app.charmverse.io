import type { Application, ApplicationStatus } from '@charmverse/core/prisma-client';

import type { ApplicationMeta } from './interfaces';

/**
 * When applications have a submission limit, we only want to count against this if it has become a completed submission
 * This allows us to have a limit of 3, but have 10 people racing to make a submission
 */
export function submissionCountsAgainstLimit({ application }: { application: Pick<Application, 'status'> }): boolean {
  return (['complete', 'paid', 'processing'] as ApplicationStatus[]).includes(application.status);
}

export function countRemainingSubmissionSlots({
  applications,
  limit
}: {
  applications: Pick<Application, 'status'>[];
  limit?: number | null;
}) {
  if (!limit) {
    return -1;
  }

  const remainingSubmissionSlots =
    limit - applications.filter((application) => submissionCountsAgainstLimit({ application })).length;

  return Math.max(0, remainingSubmissionSlots);
}
