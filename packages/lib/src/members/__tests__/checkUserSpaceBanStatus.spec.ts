import { prisma } from '@charmverse/core/prisma-client';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { createDiscordUser } from '@packages/testing/utils/discord';
import { v4 } from 'uuid';

import { checkUserSpaceBanStatus } from '../checkUserSpaceBanStatus';

describe('checkUserSpaceBanStatus', () => {
  it('should return false if no valid argument is provided', async () => {
    const isUserBannedFromSpace = await checkUserSpaceBanStatus({
      spaceIds: [v4()]
    });

    expect(isUserBannedFromSpace).toBe(false);
  });

  it('should work with custom walletAddresses', async () => {
    const walletAddress = randomETHWalletAddress();
    const { user, space } = await generateUserAndSpace({
      walletAddress
    });

    await prisma.blacklistedSpaceUser.create({
      data: {
        spaceId: space.id,
        walletAddresses: [walletAddress],
        userId: user.id
      }
    });

    const isUserBannedFromSpace = await checkUserSpaceBanStatus({
      spaceIds: [space.id],
      walletAddresses: [walletAddress]
    });

    expect(isUserBannedFromSpace).toBe(true);
  });

  it('should work with custom emails', async () => {
    const email = `${v4()}@gmail.com`;
    const { user, space } = await generateUserAndSpace();

    await prisma.verifiedEmail.create({
      data: {
        email,
        userId: user.id,
        name: 'test',
        avatarUrl: 'test'
      }
    });

    await prisma.blacklistedSpaceUser.create({
      data: {
        spaceId: space.id,
        emails: [email],
        userId: user.id
      }
    });

    const isUserBannedFromSpace = await checkUserSpaceBanStatus({
      spaceIds: [space.id],
      emails: [email]
    });

    expect(isUserBannedFromSpace).toBe(true);
  });

  it('should work with custom discord id', async () => {
    const discordId = v4();
    const { user, space } = await generateUserAndSpace();

    await createDiscordUser({
      discordUserId: discordId,
      userId: user.id
    });

    await prisma.blacklistedSpaceUser.create({
      data: {
        spaceId: space.id,
        discordId,
        userId: user.id
      }
    });

    const isUserBannedFromSpace = await checkUserSpaceBanStatus({
      spaceIds: [space.id],
      discordId
    });

    expect(isUserBannedFromSpace).toBe(true);
  });

  it('should work with user id', async () => {
    const { user, space } = await generateUserAndSpace();

    await prisma.blacklistedSpaceUser.create({
      data: {
        spaceId: space.id,
        userId: user.id
      }
    });

    const isUserBannedFromSpace = await checkUserSpaceBanStatus({
      spaceIds: [space.id],
      discordId: v4(),
      walletAddresses: [randomETHWalletAddress()],
      emails: [`${v4()}@gmail.com`],
      userId: user.id
    });

    expect(isUserBannedFromSpace).toBe(true);
  });

  it(`should return false if user is not banned from space`, async () => {
    const { user, space: space1 } = await generateUserAndSpace();
    const { space: space2 } = await generateUserAndSpace();
    await prisma.blacklistedSpaceUser.create({
      data: {
        spaceId: space1.id,
        userId: user.id
      }
    });

    const isUserBannedFromSpace = await checkUserSpaceBanStatus({
      spaceIds: [space2.id],
      userId: user.id
    });

    expect(isUserBannedFromSpace).toBe(false);
  });
});
