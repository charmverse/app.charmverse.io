import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { DiscordAccount } from '@packages/lib/discord/client/getDiscordAccount';

import { findUserByIdentity, getUserSummonProfile } from './api';
import { TENANT_URLS } from './constants';

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
    const summonApiUrl = TENANT_URLS[space.xpsEngineId];
    if (!summonApiUrl) {
      log.debug('Space does not have a Summon URL', { spaceId, xpsEngineId: space.xpsEngineId });
      return { isVerified: false, reason: 'Space does not have a Summon URL' };
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
    const spaceRole = await prisma.spaceRole.findUnique({
      where: {
        spaceUser: {
          userId,
          spaceId
        }
      }
    });
    let xpsUserId = spaceRole?.xpsUserId;
    if (!xpsUserId) {
      const discordAccount = user.discordUser?.account as unknown as DiscordAccount;
      xpsUserId = await findUserByIdentity(
        {
          // walletAddress: '0x91d76d31080ca88339a4e506affb4ded4b192bcb',
          walletAddress: user.wallets[0]?.address,
          email: user.googleAccounts[0]?.email,
          discordHandle: discordAccount?.username
        },
        summonApiUrl
      );
      // check another user isnt already using this Summon account
      if (xpsUserId) {
        const existing = await prisma.spaceRole.findUnique({
          where: {
            xpsUserId
          }
        });
        if (existing) {
          return { isVerified: false, reason: 'User is already registered to another account' };
        }
      }
    }
    if (!xpsUserId) {
      return { isVerified: false, reason: 'User does not have a Summon ID' };
    }
    const summonUserInfo = await getUserSummonProfile({
      xpsUserId,
      summonApiUrl
    });
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
