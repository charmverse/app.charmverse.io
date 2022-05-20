import { Application, ApplicationStatus, Bounty, Space, User } from '@prisma/client';
import { prisma } from 'db';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { countValidSubmissions, submissionsCapReached } from '../shared';

let user: User;
let space: Space;

function generateBountyWithSingleApplication ({ applicationStatus, bountyCap }:
  {applicationStatus: ApplicationStatus, bountyCap: number | null}): Promise<Bounty & {applications: Application[]}> {
  return prisma.bounty.create({
    data: {
      createdBy: user.id,
      chainId: 1,
      rewardAmount: 1,
      rewardToken: 'ETH',
      title: 'Example',
      spaceId: space.id,
      description: '',
      descriptionNodes: '',
      approveSubmitters: false,
      // Important variable
      maxSubmissions: bountyCap,
      applications: {
        create: {
          applicant: {
            connect: {
              id: user.id
            }
          },
          message: 'I can do this!',
          // Other important variable
          status: applicationStatus
        }
      }
    },
    include: {
      applications: true
    }
  });
}

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
        applicationStatus: 'inProgress'
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'review'
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'complete'
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'paid'
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
      applicationStatus: 'review'
    });

    const capReached = submissionsCapReached({ bounty, submissions: bounty.applications });

    expect(capReached).toBe(false);
  });

  it('should return false if the amount of applications for a bounty is below its max submissions cap', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyCap: 2,
      applicationStatus: 'review'
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
        applicationStatus: 'inProgress'
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'review'
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'complete'
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'paid'
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
      applicationStatus: 'rejected'
    });

    const validSubmissions = countValidSubmissions(bounty.applications);

    expect(validSubmissions).toBe(0);
  });

  it("should ignore applications with 'applied' status when calculating the cap", async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyCap: 1,
      applicationStatus: 'applied'
    });

    const validSubmissions = countValidSubmissions(bounty.applications);

    expect(validSubmissions).toBe(0);
  });

  it('should return 0 if an undefined or null value is passed', async () => {
    expect(countValidSubmissions(undefined as any)).toBe(0);
    expect(countValidSubmissions(null as any)).toBe(0);
  });
});
