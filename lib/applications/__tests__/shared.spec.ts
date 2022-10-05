import type { ApplicationStatus, Space, User } from '@prisma/client';
import { BountyStatus } from '@prisma/client';

import { generateBounty, generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { bountyCanReceiveNewSubmissionsOrApplications, countValidSubmissions, submissionIsEditable, submissionsCapReached } from '../shared';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);
  user = generated.user;
  space = generated.space;
});

describe('submissionsCapReached', () => {

  it('should return true if the amount of valid submissions which are inProgress, review, complete or paid for a bounty is equal to or above its max submissions cap', async () => {

    const bountiesWithRelevantApplicationStatuses = await Promise.all([
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'inProgress',
        spaceId: space.id,
        userId: user.id
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'review',
        spaceId: space.id,
        userId: user.id
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'complete',
        spaceId: space.id,
        userId: user.id
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'paid',
        spaceId: space.id,
        userId: user.id
      })
    ]);

    bountiesWithRelevantApplicationStatuses.forEach(bounty => {
      const capReached = submissionsCapReached({ bounty, submissions: bounty.applications });

      expect(capReached).toBe(true);
    });

  });

  it('should return true if the maxSubmissions cap for a bounty is 0', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyCap: 0,
      applicationStatus: 'review',
      spaceId: space.id,
      userId: user.id
    });

    const capReached = submissionsCapReached({ bounty, submissions: bounty.applications });

    expect(capReached).toBe(true);
  });

  it('should return false if the maxSubmissions cap for a bounty is null', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyCap: null,
      applicationStatus: 'review',
      spaceId: space.id,
      userId: user.id
    });

    const capReached = submissionsCapReached({ bounty, submissions: bounty.applications });

    expect(capReached).toBe(false);
  });

  it('should return false if the amount of applications for a bounty is below its max submissions cap', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyCap: 2,
      applicationStatus: 'review',
      spaceId: space.id,
      userId: user.id
    });

    const capReached = submissionsCapReached({ bounty, submissions: bounty.applications });

    expect(capReached).toBe(false);
  });

});

describe('countValidSubmissions', () => {

  it('should only count submissions which are inProgress, review, complete or paid', async () => {

    const bountiesWithRelevantApplicationStatuses = await Promise.all([
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'inProgress',
        spaceId: space.id,
        userId: user.id
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'review',
        spaceId: space.id,
        userId: user.id
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'complete',
        spaceId: space.id,
        userId: user.id
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'paid',
        spaceId: space.id,
        userId: user.id
      })
    ]);

    bountiesWithRelevantApplicationStatuses.forEach(bounty => {
      const validSubmissions = countValidSubmissions(bounty.applications);

      expect(validSubmissions).toBe(1);
    });

  });

  it("should ignore applications with 'rejected' status when calculating the cap", async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyCap: 1,
      applicationStatus: 'rejected',
      spaceId: space.id,
      userId: user.id
    });

    const validSubmissions = countValidSubmissions(bounty.applications);

    expect(validSubmissions).toBe(0);
  });

  it("should ignore applications with 'applied' status when calculating the cap", async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyCap: 1,
      applicationStatus: 'applied',
      spaceId: space.id,
      userId: user.id
    });

    const validSubmissions = countValidSubmissions(bounty.applications);

    expect(validSubmissions).toBe(0);
  });

  it('should return 0 if an undefined or null value is passed', async () => {
    expect(countValidSubmissions(undefined as any)).toBe(0);
    expect(countValidSubmissions(null as any)).toBe(0);
  });
});

describe('bountyCanReceiveNewSubmissionsOrApplications', () => {

  it('should return true if the bounty status is open and the submissions cap is not reached', async () => {
    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: null
    });

    const canReceive = bountyCanReceiveNewSubmissionsOrApplications({
      bounty,
      submissionsAndApplications: []
    });

    expect(canReceive).toBe(true);
  });

  it('should return false if the bounty status is open but the submissions cap is reached', async () => {
    const bountyWithApp = await generateBountyWithSingleApplication({
      applicationStatus: 'inProgress',
      bountyCap: 1,
      spaceId: space.id,
      userId: user.id
    });

    const canReceive = bountyCanReceiveNewSubmissionsOrApplications({
      bounty: bountyWithApp,
      submissionsAndApplications: bountyWithApp.applications
    });

    expect(canReceive).toBe(false);

  });

  it('should return false if the bounty status is not open', async () => {

    const notOpenStatuses = (Object.keys(BountyStatus) as BountyStatus[]).filter(status => status !== 'open');

    const bounties = await Promise.all(
      notOpenStatuses.map(status => generateBounty({
        createdBy: user.id,
        spaceId: space.id,
        status,
        approveSubmitters: false
      }))
    );

    for (const bounty of bounties) {
      const canReceive = bountyCanReceiveNewSubmissionsOrApplications({ bounty, submissionsAndApplications: [] });
      expect(canReceive).toBe(false);
    }
  });
});

describe('submissionIsEditable', () => {
  it('should return true  if submission status is "inProgress" or "review" AND bounty is "open" or "inProgress"', async () => {

    const validStatusCombinations: { bountyStatus: BountyStatus, submissionStatus: ApplicationStatus }[] = [
      {
        bountyStatus: 'inProgress',
        submissionStatus: 'inProgress'
      },
      {
        bountyStatus: 'inProgress',
        submissionStatus: 'review'
      },
      {
        bountyStatus: 'open',
        submissionStatus: 'inProgress'
      },
      {
        bountyStatus: 'open',
        submissionStatus: 'review'
      }
    ];

    const bountiesWithSubmissions = await Promise.all(validStatusCombinations.map(combo => {
      return generateBountyWithSingleApplication({
        applicationStatus: combo.submissionStatus,
        bountyCap: 2,
        spaceId: space.id,
        userId: user.id,
        bountyStatus: combo.bountyStatus
      });
    }));

    bountiesWithSubmissions.forEach(bountyWithSubmission => {
      const isUpdateable = submissionIsEditable({
        bounty: bountyWithSubmission,
        submission: bountyWithSubmission.applications[0]
      });
      expect(isUpdateable).toBe(true);
    });

  });

  it('should return false if submission status is not "inProgress" or "review"', async () => {
    const bountyWithSubmission = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
      bountyCap: 2,
      spaceId: space.id,
      userId: user.id,
      bountyStatus: 'inProgress'
    });

    const isUpdateable = submissionIsEditable({
      bounty: bountyWithSubmission,
      submission: bountyWithSubmission.applications[0]
    });
    expect(isUpdateable).toBe(false);
  });

  it('should return false bounty is not "open" or "inProgress"', async () => {
    const bountyWithSubmission = await generateBountyWithSingleApplication({
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: user.id,
      bountyStatus: 'complete'
    });

    const isUpdateable = submissionIsEditable({
      bounty: bountyWithSubmission,
      submission: bountyWithSubmission.applications[0]
    });
    expect(isUpdateable).toBe(false);
  });
});
