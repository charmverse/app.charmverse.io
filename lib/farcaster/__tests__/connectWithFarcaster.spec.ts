import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-client';
import { InvalidStateError } from '@packages/nextjs/errors';
import { generateFarcasterUser, generateUserAndSpace } from '@packages/testing/setupDatabase';

import { connectFarcaster } from '../connectFarcaster';

const getProfile = ({ userId }: { userId: string }) =>
  ({
    userId,
    fid: Math.floor(Math.random() * 1000),
    username: '@test',
    bio: 'biooo',
    displayName: 'My name',
    pfpUrl: 'https://example.com'
  }) as FarcasterBody & { userId: string };

describe('connectFarcaster', () => {
  test('should connect a user to a Farcaster profile', async () => {
    const { user } = await generateUserAndSpace();
    await connectFarcaster(getProfile({ userId: user.id }));

    const farcasterUser = await prisma.farcasterUser.findUnique({
      where: {
        userId: user.id
      }
    });

    await expect(farcasterUser).toBeDefined();
  });

  test('should succeed if another user has already connected the profile', async () => {
    const { user } = await generateUserAndSpace();
    const { user: connectedUser } = await generateUserAndSpace();
    const profile = getProfile({ userId: user.id });
    await generateFarcasterUser({
      userId: connectedUser.id,
      fid: profile.fid
    });

    await connectFarcaster(profile);

    const farcasterUser = await prisma.farcasterUser.findUnique({
      where: {
        userId: user.id
      }
    });

    await expect(farcasterUser).toBeDefined();
  });
});
