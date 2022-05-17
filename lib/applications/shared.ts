import { Application, User } from '@prisma/client';

/**
 * Whether an application is currently a valid submission
 * @param application
 * @returns
 */
export function applicantIsSubmitter (application: Application): boolean {
  return application.status !== 'applied' && application.status !== 'rejected';
}

export function moveUserApplicationToFirstRow (submissions: Application[], userId: string): Application[] {

  const copiedSubmissions = submissions.slice();

  const usersubmissionIndex = copiedSubmissions.findIndex(app => {
    return app.createdBy === userId;
  });

  if (usersubmissionIndex > 0) {

    const usersubmission = copiedSubmissions[usersubmissionIndex];

    copiedSubmissions.splice(usersubmissionIndex, 1);
    copiedSubmissions.splice(0, 0, usersubmission);
  }

  return copiedSubmissions;

}
