import { Application, ApplicationStatus, Bounty, Space, User } from '@prisma/client';
import { prisma } from 'db';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { countValidSubmissions, submissionsCapReached } from '../shared';

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
