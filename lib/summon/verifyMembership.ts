import { prisma } from 'db';
import type { DiscordAccount } from 'lib/discord/getDiscordAccount';
import log from 'lib/log';

import { findUserByIdentity, getUserInventory } from './api';

export type VerificationResponse =
  | {
      isVerified: true;
      summonUserId: string;
      summonTenantId: string;
    }
  | {
      isVerified: false;
      reason: string;
    };

export async function verifyMembership({
  userId,
  spaceId
}: {
  userId: string;
  spaceId: string;
}): Promise<VerificationResponse> {
  try {
    const space = await prisma.space.findUniqueOrThrow({
      where: {
        id: spaceId
      },
      select: {
        xpsEngineId: true
      }
    });
    if (!space.xpsEngineId) {
      log.debug('Space does not have a Summon tenant ID', { spaceId });
      return { isVerified: false, reason: 'Space does not have a Summon tenant ID' };
    }
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id: userId
      },
      include: {
        discordUser: true,
        googleAccounts: true,
        wallets: true
      }
    });
    const discordAccount = user.discordUser?.account as unknown as DiscordAccount;
    const summonUserId = await findUserByIdentity({
      walletAddress: user.wallets[0]?.address,
      email: user.googleAccounts[0]?.email,
      discordHandle: discordAccount?.username
    });
    if (!summonUserId) {
      return { isVerified: false, reason: 'User does not have a Summon ID' };
    }
    const summonUserInfo = await getUserInventory(summonUserId);
    if (!summonUserInfo) {
      return { isVerified: false, reason: 'User does not have a Summon account' };
    }
    // @ts-ignore console.log(summonUserInfo);
    if (summonUserInfo.tenantId !== space.xpsEngineId) {
      return { isVerified: false, reason: 'User is not a member of this Summon tenant' };
    }
    return {
      isVerified: true,
      summonUserId: summonUserInfo.id,
      summonTenantId: space.xpsEngineId
    };
  } catch (error) {
    log.error('Error verifying user membership', { error });
    return { isVerified: false, reason: 'Error verifying user membership' };
  }
}
