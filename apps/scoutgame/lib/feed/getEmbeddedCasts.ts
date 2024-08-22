import { GET } from '@root/adapters/http';
import { NEYNAR_API_KEY } from '@root/lib/farcaster/constants';
import { isTruthy } from '@root/lib/utils/types';

import type { Cast } from './getFarcasterUserReactions';

type CastsResponse = {
  result: {
    casts: Cast[];
  };
};

const neynarBaseUrl = 'https://api.neynar.com/v2/farcaster';

export async function getEmbeddedCasts({ casts }: { casts: Cast[] }) {
  const embeddedCastHashes = Array.from(
    new Set(
      casts
        .map((cast) =>
          cast.embeds.map((embed) => ('cast_id' in embed ? embed.cast_id.hash : undefined)).filter(isTruthy)
        )
        .flat()
    )
  );

  if (embeddedCastHashes.length) {
    const embeddedCasts = await GET<CastsResponse>(
      `${neynarBaseUrl}/casts`,
      {
        casts: embeddedCastHashes.join(',')
      },
      {
        headers: {
          Api_key: NEYNAR_API_KEY
        }
      }
    );

    return embeddedCasts.result.casts;
  }

  return [];
}
