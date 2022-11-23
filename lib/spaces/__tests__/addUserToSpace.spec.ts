import type { Space } from '@prisma/client';

import { prisma } from 'db';
import { addUserToSpace } from 'lib/spaces/addUserToSpace';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { addDiscordUser } from 'testing/utils/members';

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

  it('Should add admin user based onadmin discord id', async () => {
    const { user } = await generateUserAndSpaceWithApiToken();
    // add discord user
    await addDiscordUser({ userId: user.id, discordId: 'discord-admin-123' });
    // add space discord admin
    await prisma.space.update({ where: { id: space.id }, data: { adminDiscordUserId: 'discord-admin-123' } });

    await addUserToSpace({ spaceRole: { spaceId: space.id, userId: user.id, isAdmin: false }, userId: user.id, spaceId: space.id });

    const spaceRole = await prisma.spaceRole.findFirst({ where: { userId: user.id, spaceId: space.id } });
    expect(spaceRole).toBeDefined();
    expect(spaceRole?.isAdmin).toBe(true);
  });
});
