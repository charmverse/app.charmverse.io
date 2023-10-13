import type { Application } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import { LimitReachedError, WrongStateError } from 'lib/utilities/errors';
import { generateBounty, generateUserAndSpace } from 'testing/setupDatabase';

import type { ApplicationCreationData } from '../createApplication';
import { createApplication } from '../createApplication';

let user: any;
let space: any;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

describe('createApplication', () => {
  // Success Cases

  it('should create an application if reward requires applications, and a submission if not', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5
    });

    const applicationData: ApplicationCreationData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Sample message for testing',
      submission: 'Sample submission data',
      submissionNodes: '{}'
    };

    const application = await createApplication(applicationData);

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

    const submission = await createApplication({ ...applicationData, userId: spaceMember.id });

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

  // Error Cases

  it('should fail if Submission cap reached', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 2
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

    await expect(createApplication(applicationData)).rejects.toThrow(LimitReachedError);
  });

  it('should fail if the reward is marked complete', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 2,
      status: 'complete'
    });

    const applicationData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Sample message for testing',
      submission: 'Sample submission data',
      submissionNodes: '{}',
      status: 'applied'
    };

    await expect(createApplication(applicationData)).rejects.toThrow(WrongStateError);
  });
});
