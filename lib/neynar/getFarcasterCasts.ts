import { GET } from '@root/adapters/http';

import type { Cast } from './interfaces';

const neynarBaseUrl = 'https://api.neynar.com/v2/farcaster';

type FarcasterCastsResponse = {
  result: {
    casts: Cast[];
  };
};

export async function getFarcasterCasts(castHashes: string[]) {
  const farcasterCastsResponse = await GET<FarcasterCastsResponse>(
    `${neynarBaseUrl}/casts`,
    {
      casts: castHashes.join(',')
    },
    {
      headers: {
        Api_key: process.env.NEYNAR_API_KEY
      }
    }
  );

  return farcasterCastsResponse.result.casts;
}
