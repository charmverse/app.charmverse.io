import type { Space } from '@prisma/client';

import { prisma } from 'db';
import { addUserToSpace } from 'lib/spaces/addUserToSpace';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
});

describe('addUserToSpace', () => {
  it('Should add non-admin user space role', async () => {
    const { user } = await generateUserAndSpaceWithApiToken();
    await addUserToSpace({ spaceRole: { spaceId: space.id, userId: user.id, isAdmin: false }, userId: user.id, spaceId: space.id });

    const spaceRole = await prisma.spaceRole.findFirst({ where: { userId: user.id, spaceId: space.id } });
    expect(spaceRole).toBeDefined();
    expect(spaceRole?.isAdmin).toBe(false);
  });

  it('Should add admin user space role', async () => {
    const { user } = await generateUserAndSpaceWithApiToken();
    await addUserToSpace({ spaceRole: { spaceId: space.id, userId: user.id, isAdmin: true }, userId: user.id, spaceId: space.id });

    const spaceRole = await prisma.spaceRole.findFirst({ where: { userId: user.id, spaceId: space.id } });
    expect(spaceRole).toBeDefined();
    expect(spaceRole?.isAdmin).toBe(true);
  });
});
