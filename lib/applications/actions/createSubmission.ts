import type { Application } from '@prisma/client';

import { prisma } from 'db';
import { getBountyOrThrow } from 'lib/bounties/getBounty';
import { DuplicateDataError, MissingDataError, UnauthorisedActionError } from 'lib/utilities/errors';

import type { SubmissionCreationData } from '../interfaces';
import { bountyCanReceiveNewSubmissionsOrApplications } from '../shared';

export async function createSubmission ({ bountyId, submissionContent, userId }: SubmissionCreationData): Promise<Application> {
  const bounty = await getBountyOrThrow(bountyId);

  if (bounty.approveSubmitters === true) {
    throw new UnauthorisedActionError('This bounty requires submitters to apply first.');
  }

  if (!bountyCanReceiveNewSubmissionsOrApplications({ bounty, submissionsAndApplications: bounty.applications })) {
    throw new UnauthorisedActionError('This bounty cannot accept submissions');
  }

  const existingApplication = bounty.applications.find(app => app.createdBy === userId);

  if (existingApplication) {
    throw new DuplicateDataError('You already have a submission for this bounty');
  }

  if (!submissionContent.submission || submissionContent.submission.length < 1 || !submissionContent.submissionNodes) {
    throw new MissingDataError('You must provide content in your submission');
  }

  if (!submissionContent.walletAddress) {
    throw new MissingDataError('You must provide a wallet address in your submission');
  }

  return prisma.application.create({
    data: {
      message: '',
      status: 'review',
      walletAddress: submissionContent.walletAddress,
      submission: submissionContent.submission,
      submissionNodes: typeof submissionContent.submissionNodes === 'object' ? JSON.stringify(submissionContent.submissionNodes) : submissionContent.submissionNodes,
      bounty: {
        connect: {
          id: bountyId
        }
      },
      applicant: {
        connect: {
          id: userId
        }
      },
      spaceId: bounty.spaceId
    }
  });

}
