import { Application, Bounty, User } from '@prisma/client';
import { BountyWithDetails } from 'models';

export const MINIMUM_APPLICATION_MESSAGE_CHARACTERS = 10;

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

export function countValidSubmissions (submissions: Application[]): number {
  return submissions?.reduce((count, submission) => {
    if (submission.status !== 'applied' && submission.status !== 'rejected') {
      return count + 1;
    }
    return count;
  }, 0) ?? 0;
}

/*
 * Whether a bounty can accept more submissions
 */
export function submissionsCapReached ({ bounty, submissions }: {bounty: Bounty, submissions: Application[]}): boolean {
  if (bounty.maxSubmissions === null) {
    return false;
  }

  const validSubmissions = countValidSubmissions(submissions);

  return validSubmissions >= bounty.maxSubmissions;

}

export function bountyCanReceiveNewSubmissionsOrApplications ({ bounty, submissionsAndApplications }:
  {bounty: Bounty, submissionsAndApplications: Application[]}): boolean {
  if (bounty.status !== 'open') {
    return false;
  }

  return !submissionsCapReached({ bounty, submissions: submissionsAndApplications });
}
