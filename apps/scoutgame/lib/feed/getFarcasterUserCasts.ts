import { GET } from '@root/adapters/http';
import { NEYNAR_API_BASE_URL, NEYNAR_API_KEY } from '@root/lib/farcaster/constants';

import type { Cast } from './getFarcasterUserReactions';

type UserCastsResponse = {
  casts: Cast[];
};

export async function getFarcasterUserCasts({ fid }: { fid: number }) {
  const userCastsResponse = await GET<UserCastsResponse>(
    `${NEYNAR_API_BASE_URL}/feed`,
    {
      fids: fid,
      feed_type: 'filter',
      filter_type: 'fids',
      with_recasts: 'false',
      limit: 25
    },
    {
      headers: {
        Api_key: NEYNAR_API_KEY
      }
    }
  );

  return userCastsResponse.casts;
}
