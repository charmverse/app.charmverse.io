import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { GET as httpGET } from '@packages/utils/http';

// https://docs.talentprotocol.com/docs/developers/talent-api/api-reference/talent-passports
type PassportResponse = {
  passport: {
    score: number;
    user: {
      id: string;
    };
  };
};

export async function getWalletTalentProfile(address: string): Promise<PassportResponse['passport'] | null> {
  const passportResponse = await httpGET<PassportResponse>(
    `https://api.talentprotocol.com/api/v2/passports/${address}`,
    {
      headers: {
        'X-API-KEY': process.env.TALENT_PROTOCOL_API_KEY
      }
    }
  );
  return passportResponse.passport || null;
}

export async function getTalentProfile({
  farcasterId,
  wallets,
  minimumTalentScore = 0
}: {
  farcasterId: number | null;
  wallets: string[];
  minimumTalentScore?: number;
}) {
  if (wallets.length === 0 && farcasterId) {
    const farcasterProfile = await getFarcasterUserById(farcasterId);
    // console.log('farcasterProfile', farcasterProfile?.verifications);
    wallets = farcasterProfile?.verifications.map((address) => address);
    log.debug('Found wallets from Farcaster', { farcasterId, wallets });
  }
  for (const wallet of wallets) {
    const talentProfile = await getWalletTalentProfile(wallet).catch(() => null);
    if (talentProfile && talentProfile.score > minimumTalentScore) {
      return { wallet, talentId: talentProfile.user.id, score: talentProfile.score };
    }
  }
  return null;
}
