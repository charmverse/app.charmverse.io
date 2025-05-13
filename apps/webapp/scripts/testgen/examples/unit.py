unit_test_example = """
import type { Application } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { DuplicateDataError, InvalidInputError, LimitReachedError, WrongStateError } from 'lib/utilities/errors';
import { generateBounty } from '@packages/testing/setupDatabase';
import type { WorkUpsertData } from '../work';
import { work } from '../work';

let user: any;
let space: any;

beforeAll(async () => {
  ({ user, space } = await testUtilsUser.generateUserAndSpace());
});

describe('work', () => {
  const genApplicationData = (overwrites: Partial<WorkUpsertData> = {}): WorkUpsertData => ({
    userId: user.id,
    message: 'Sample message',
    submission: 'Sample submission',
    submissionNodes: '{}',
    ...overwrites
  });

  it('should create an application if reward requires applications, and a submission if not', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5
    });

    const applicationData: WorkUpsertData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Sample message for testing',
      submission: 'Sample submission data',
      submissionNodes: '{}'
    };

    const application = await work(applicationData);

    expect(application).toMatchObject(
      expect.objectContaining<Partial<Application>>({
        status: 'applied',
        acceptedBy: null, // you might want to fill in specific values here if necessary
        bountyId: expect.any(String), // assuming it's a string type, adjust if needed
        createdAt: expect.any(Date),
        createdBy: expect.any(String), // adjust type if needed
        id: expect.any(String),
        message: expect.any(String),
        reviewedBy: null, // or expect.any(String) if it's supposed to be a string
        spaceId: expect.any(String),
        submission: expect.any(String),
        submissionNodes: expect.any(String), // this is the stringified JSON or regular string
        updatedAt: expect.any(Date),
        walletAddress: null // or expect.any(String) if it's supposed to be a string
      })
    );

    // If user applies at a time where approveSubmitters is false
    await prisma.bounty.update({
      where: {
        id: reward.id
      },
      data: {
        approveSubmitters: false
      }
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const submission = await work({ ...applicationData, userId: spaceMember.id });

    expect(submission).toMatchObject(
      expect.objectContaining<Partial<Application>>({
        status: 'inProgress',
        acceptedBy: null, // you might want to fill in specific values here if necessary
        bountyId: expect.any(String), // assuming it's a string type, adjust if needed
        createdAt: expect.any(Date),
        createdBy: expect.any(String), // adjust type if needed
        id: expect.any(String),
        message: expect.any(String),
        reviewedBy: null, // or expect.any(String) if it's supposed to be a string
        spaceId: expect.any(String),
        submission: expect.any(String),
        submissionNodes: expect.any(String), // this is the stringified JSON or regular string
        updatedAt: expect.any(Date),
        walletAddress: null // or expect.any(String) if it's supposed to be a string
      })
    );
  });

 it('should fail if Submission cap reached', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 2,
      allowMultipleApplications: true
    });

    const applicationData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Sample message for testing',
      submission: 'Sample submission data',
      submissionNodes: '{}',
      status: 'applied'
    };

    // Cap is reached when enough reward submissions are marked as complete
    await prisma.application.createMany({
      data: [1, 2, 3, 4].map(() => ({ bountyId: reward.id, createdBy: user.id, spaceId: space.id, status: 'complete' }))
    });

    await expect(work(applicationData)).rejects.toThrow(LimitReachedError);
  });
});"""