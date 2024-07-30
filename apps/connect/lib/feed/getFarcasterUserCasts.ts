import { GET } from '@root/adapters/http';

import { getEmbeddedCasts } from './getEmbeddedCasts';
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

  const userCasts = userCastsResponse.casts;

  const embeddedCasts = await getEmbeddedCasts({
    casts: userCasts.map((cast) => cast)
  });

  return userCasts.map((cast) => {
    return {
      ...cast,
      embeds: cast.embeds.map((embed) => {
        if ('cast_id' in embed) {
          return {
            cast_id: {
              ...embed.cast_id,
              cast: embeddedCasts.find((embeddedCast) => embeddedCast.hash === embed.cast_id.hash)!
            }
          };
        }

        return embed;
      })
    };
  });
}
