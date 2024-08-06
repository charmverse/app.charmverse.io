import { GET } from '@root/adapters/http';

import type { Cast } from './getFarcasterUserReactions';

const neynarBaseUrl = 'https://api.neynar.com/v2/farcaster';

type UserCastsResponse = {
  casts: Cast[];
};

export async function getFarcasterUserCasts({ fid }: { fid: number }) {
  const userCastsResponse = await GET<UserCastsResponse>(
    `${neynarBaseUrl}/feed`,
    {
      fids: fid,
      feed_type: 'filter',
      filter_type: 'fids',
      with_recasts: 'false',
      limit: 25
    },
    {
      headers: {
        Api_key: process.env.NEYNAR_API_KEY
      }
    }
  );

  return userCastsResponse.casts;
}
