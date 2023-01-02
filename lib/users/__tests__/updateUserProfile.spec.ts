import type { User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { typedKeys } from 'lib/utilities/objects';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { updateUserProfile } from '../updateUserProfile';

describe('updateUserProfile', () => {
  it('should only update users identityType, username, path, avatar, avatarTokenId, avatarChain and avatarContract properties', async () => {
    const { user } = await generateUserAndSpaceWithApiToken();

    const domain = `random-domain-${v4()}.nft`;

    const unstoppableDomain = await prisma.unstoppableDomain.create({
      data: {
        domain,
        user: {
          connect: {
            id: user.id
          }
        }
      }
    });

    const update: Partial<User> = {
      identityType: 'UnstoppableDomain',
      username: unstoppableDomain.domain,
      avatarChain: 23,
      avatarContract: 'random-contract-address',
      avatarTokenId: `0x123456`,
      path: `new-path-${v4()}`
    };

    const updatedUser = await updateUserProfile(user.id, {
      id: 'new-invalid-id',
      isBot: true,
      // Values we want
      ...update
    });

    // Preserved values
    expect(updatedUser.id).toBe(user.id);
    expect(updatedUser.isBot).toBe(user.isBot);

    typedKeys(update).forEach((key) => {
      expect(updatedUser[key]).toEqual(update[key]);
    });
  });

  it('should update the user avatar to the Google avatar when switching to a Google identity', async () => {
    const { user } = await generateUserAndSpaceWithApiToken();

    const googleAccount = await prisma.googleAccount.create({
      data: {
        email: `acc-${v4()}@google.com`,
        name: `test name`,
        avatarUrl: `https://example.com/photourl.png`,
        user: {
          connect: {
            id: user.id
          }
        }
      }
    });

    const update: Partial<User> = {
      identityType: 'Google',
      username: googleAccount.name,
      avatar: googleAccount.avatarUrl
    };

    const updatedUser = await updateUserProfile(user.id, update);

    // Preserved values
    expect(updatedUser.username).toBe(googleAccount.name);
    expect(updatedUser.identityType).toBe('Google');
    expect(updatedUser.avatar).toBe(googleAccount.avatarUrl);
  });
});
