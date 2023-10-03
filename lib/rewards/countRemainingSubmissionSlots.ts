import type { Application, ApplicationStatus } from '@charmverse/core/prisma-client';

import type { ApplicationMeta } from './interfaces';

/**
 * When applications have a submission limit, we only want to count against this if it has become a completed submission
 * This allows us to have a limit of 3, but have 10 people racing to make a submission
 */
export function submissionIsValid({ application }: { application: Pick<Application, 'status'> }): boolean {
  return (['complete', 'paid', 'processing'] as ApplicationStatus[]).includes(application.status);
}
export function countValidSubmissions({ applications }: { applications: Pick<Application, 'status'>[] }) {
  return applications.filter((application) => submissionIsValid({ application })).length;
}

export function countRemainingSubmissionSlots({
  applications,
  limit
}: {
  applications: Pick<Application, 'status'>[];
  limit?: number | null;
}): number | null {
  if (!limit) {
    return null;
  }

  const remainingSubmissionSlots = limit - countValidSubmissions({ applications });

  return Math.max(0, remainingSubmissionSlots);
}
