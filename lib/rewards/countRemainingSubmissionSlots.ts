import type { Application, ApplicationStatus } from '@charmverse/core/prisma-client';

export type ApplicationWithOnlyStatus = Pick<Application, 'status'>;

/**
 * When applications have a submission limit, we only want to count against this if it has become a completed submission
 * This allows us to have a limit of 3, but have 10 people racing to make a submission
 */
export function submissionIsComplete({ application }: { application: ApplicationWithOnlyStatus }): boolean {
  return (['complete', 'paid', 'processing'] as ApplicationStatus[]).includes(application.status);
}
export function countCompleteSubmissions({ applications }: { applications: Pick<Application, 'status'>[] }) {
  return applications.filter((application) => submissionIsComplete({ application })).length;
}

export function countRemainingSubmissionSlots({
  applications,
  limit
}: {
  applications: ApplicationWithOnlyStatus[];
  limit?: number | null;
}): number | null {
  if (!limit) {
    return null;
  }

  const remainingSubmissionSlots = limit - countCompleteSubmissions({ applications });

  return Math.max(0, remainingSubmissionSlots);
}
