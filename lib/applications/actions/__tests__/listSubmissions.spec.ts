import { Space, User } from '@prisma/client';
import { generateBountyWithSingleApplication, generateTransaction, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { listSubmissions } from '../listSubmissions';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('listSubmissions', () => {
  it('Should retrieve transaction for a submission', async () => {
    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
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
