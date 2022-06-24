import { User, Space } from '@prisma/client';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { getCompletedApplicationsOfUser } from '../getCompletedApplicationsOfUser';

let user1: User;
let user2: User;
let space1: Space;
let space2: Space;

beforeAll(async () => {
  const generated1 = await generateUserAndSpaceWithApiToken(undefined, true);
  user1 = generated1.user;
  space1 = generated1.space;

  const generated2 = await generateUserAndSpaceWithApiToken(undefined, true);
  user2 = generated2.user;
  space2 = generated2.space;
});

describe('getCompletedApplicationsOfUser', () => {
  it('should return completed applications of user', async () => {
    await Promise.all([
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'complete',
        spaceId: space1.id,
        userId: user1.id
      }),
      generateBountyWithSingleApplication({
        bountyCap: 1,
        applicationStatus: 'complete',
        spaceId: space2.id,
        userId: user1.id
      })
    ]);

    const completedApplicationsCountOfUser1 = await getCompletedApplicationsOfUser(user1.id);
    const completedApplicationsCountOfUser2 = await getCompletedApplicationsOfUser(user2.id);
    expect(completedApplicationsCountOfUser1).toBe(2);
    expect(completedApplicationsCountOfUser2).toBe(0);
  });
});
