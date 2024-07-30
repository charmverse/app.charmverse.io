import { GET } from '@root/adapters/http';

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
      casts.map((cast) => cast.embeds.filter((embed) => 'cast_id' in embed).map((embed) => embed.cast_id.hash)).flat()
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
          Api_key: process.env.NEYNAR_API_KEY
        }
      }
    );

    return embeddedCasts.result.casts;
  }

  return [];
}
