import type { User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';

import { getSpacesOfUser } from '../getSpacesOfUser';

let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;

  // External space the user didn't create but is a member of
  const { space } = await generateUserAndSpaceWithApiToken();
  // Inaccessible space by the user
  await generateUserAndSpaceWithApiToken();

  await prisma.spaceRole.create({
    data: {
      userId: user.id,
      spaceId: space.id
    }
  });
});

describe('getSpacesCount', () => {
  it('Should get count of spaces the user is part of', async () => {
    const spaces = await getSpacesOfUser(user.id);
    expect(spaces.length).toBe(2);
  });
});
