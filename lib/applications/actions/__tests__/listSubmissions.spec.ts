import { Space, User } from '@prisma/client';
import { generateBountyWithSingleApplication, generateSpaceUser, generateTransaction, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { listSubmissions } from '../listSubmissions';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('listSubmissions', () => {

  it('Should only return inProgress, review, complete or paid status submissions (not applied or rejected)', async () => {
    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
      bountyCap: 1,
      userId: user.id,
      bountyStatus: 'open',
      spaceId: space.id
    });

    const [user0, user1, user2, user3, user4, user5] = await Promise.all([0, 1, 2, 3, 4, 5].map(() => generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    })));

    await prisma.application.createMany({
      data: [
        {
          bountyId: bounty.id,
          createdBy: user0.id,
          status: 'applied',
          spaceId: bounty.spaceId
        },
        {
          bountyId: bounty.id,
          createdBy: user1.id,
          status: 'inProgress',
          spaceId: bounty.spaceId
        },
        {
          bountyId: bounty.id,
          createdBy: user2.id,
          status: 'review',
          spaceId: bounty.spaceId
        },
        {
          bountyId: bounty.id,
          createdBy: user3.id,
          status: 'complete',
          spaceId: bounty.spaceId
        },
        {
          bountyId: bounty.id,
          createdBy: user4.id,
          status: 'paid',
          spaceId: bounty.spaceId
        },
        {
          bountyId: bounty.id,
          createdBy: user5.id,
          status: 'rejected',
          spaceId: bounty.spaceId
        }
      ]
    });

    const submissionsWithTransaction = await listSubmissions(bounty.id);
    expect(submissionsWithTransaction.length).toBe(4);

    const subStatusApplied = submissionsWithTransaction.find(sub => sub.status === 'applied');
    const subStatusRejected = submissionsWithTransaction.find(sub => sub.status === 'rejected');

    expect(subStatusApplied).toBeUndefined();
    expect(subStatusRejected).toBeUndefined();
  });
  it('Should retrieve transaction for a submission', async () => {
    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'complete',
      bountyCap: 1,
      userId: user.id,
      bountyStatus: 'open',
      spaceId: space.id
    });

    await generateTransaction({
      applicationId: bounty.applications[0].id
    });

    const submissionsWithTransaction = await listSubmissions(bounty.id);
    expect(submissionsWithTransaction.length).toBe(1);
    expect(submissionsWithTransaction[0].transactions.length).toBe(1);
  });
});
