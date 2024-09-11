import { InvalidInputError } from '@charmverse/core/errors';
import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';
import { shortWalletAddress } from '@root/lib/utils/blockchain';

export async function findOrCreateScoutGameUser({
  fid,
  username,
  wallet
}: {
  fid: number;
  username?: string;
  wallet?: string;
}): Promise<Scout> {
  if (fid && wallet) {
    throw new InvalidInputError('Cannot provide both fid and wallet');
  } else if (!fid && !wallet) {
    throw new InvalidInputError('Must provide either fid or wallet');
  }

  const existingScout = await prisma.scout.findFirst({
    where: {
      farcasterId: fid,
      walletAddress: wallet
    }
  });

  if (existingScout) {
    return existingScout;
  }

  const existingConnectWaitlistSlot = fid
    ? await prisma.connectWaitlistSlot.findFirst({
        where: {
          fid
        },
        select: {
          username: true
        }
      })
    : null;

  const fidUserName = existingConnectWaitlistSlot?.username;

  const displayName: string =
    username ?? fidUserName ?? fid
      ? await getFarcasterProfile({
          fid
        }).then((profile) => profile?.body.username || `fid:${fid}`)
      : shortWalletAddress(wallet);

  return prisma.scout.create({
    data: {
      displayName,
      username: displayName,
      farcasterId: fid,
      walletAddress: wallet
    }
  });
}
