import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import * as api from '@packages/lib/summon/api';
import { TENANT_URLS } from '@packages/lib/summon/constants';
import type { SummonUserProfile } from '@packages/lib/summon/interfaces';

export async function getSummonProfile({
  userId,
  spaceId,
  summonTestUrl
}: {
  spaceId: string;
  userId: string;
  summonTestUrl?: string;
}): Promise<null | SummonUserProfile> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      wallets: {
        select: {
          address: true
        }
      },
      googleAccounts: true,
      discordUser: {
        select: {
          account: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }
  const spaceRole = await prisma.spaceRole.findUnique({
    where: {
      spaceUser: {
        userId,
        spaceId
      }
    },
    include: {
      space: {
        select: {
          xpsEngineId: true
        }
      }
    }
  });

  if (!spaceRole || !spaceRole.space.xpsEngineId) {
    log.debug('Space is not connected to Summon', { spaceId });
    return null;
  }
  const summonApiUrl = summonTestUrl || TENANT_URLS[spaceRole.space.xpsEngineId];

  if (!summonApiUrl) {
    log.warn('Could not find Summon API URL for tenant', { spaceId, xpsEngineId: spaceRole.space.xpsEngineId });
    return null;
  }

  const discordUserAccount = user.discordUser?.account as { username: string } | null;
  const userEmail = user.googleAccounts[0]?.email;
  const walletAddresses = user.wallets.map((wallet) => wallet.address);

  let xpsUserId = spaceRole?.xpsUserId;
  if (!xpsUserId) {
    xpsUserId = await api.findUserXpsEngineId({
      discordUserAccount,
      userEmail,
      walletAddresses,
      summonApiUrl
    });
  }

  // Summon has a bug where it returns the wrong user profile when none exist
  if (!xpsUserId || xpsUserId === '366899703492640833') {
    return null;
  }

  return api.getUserSummonProfile({
    xpsUserId,
    summonApiUrl
  });
}
