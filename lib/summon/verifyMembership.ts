import { prisma } from '@charmverse/core';

import type { DiscordAccount } from 'lib/discord/getDiscordAccount';
import log from 'lib/log';

import { findUserByIdentity, getUserProfile } from './api';

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
    let summonUserId = user.xpsEngineId;
    if (!summonUserId) {
      const discordAccount = user.discordUser?.account as unknown as DiscordAccount;
      summonUserId = await findUserByIdentity({
        // walletAddress: '0x91d76d31080ca88339a4e506affb4ded4b192bcb',
        walletAddress: user.wallets[0]?.address,
        email: user.googleAccounts[0]?.email,
        discordHandle: discordAccount?.username
      });
      // check another user isnt already using this Summon account
      if (summonUserId) {
        const existing = await prisma.user.findUnique({
          where: {
            xpsEngineId: summonUserId
          }
        });
        if (existing) {
          return { isVerified: false, reason: 'User is already registered to another account' };
        }
      }
    }
    if (!summonUserId) {
      return { isVerified: false, reason: 'User does not have a Summon ID' };
    }
    const summonUserInfo = await getUserProfile(summonUserId);
    if (!summonUserInfo) {
      return { isVerified: false, reason: 'User does not have a Summon account' };
    }
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
