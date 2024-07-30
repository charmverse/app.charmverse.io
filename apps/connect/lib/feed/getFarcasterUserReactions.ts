import { GET } from '@root/adapters/http';
import { getFarcasterUsers, type FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';
import type { IframelyResponse } from '@root/lib/iframely/getIframely';
import { getIframely } from '@root/lib/iframely/getIframely';
import { isTruthy } from '@root/lib/utils/types';
import { uniqBy } from 'lodash';

import { getEmbeddedCasts } from './getEmbeddedCasts';

const neynarBaseUrl = 'https://api.neynar.com/v2/farcaster';

type UserProfile = {
  object: string;
  fid: number;
  custody_address: string;
  username: string;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
      mentioned_profiles?: UserProfile[];
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
  active_status: string;
  power_badge: boolean;
};

export type Cast = {
  object: 'cast';
  hash: string;
  thread_hash: string;
  parent_hash: string | null;
  parent_url: string | null;
  root_parent_url: string | null;
  parent_author: FarcasterUser;
  author: UserProfile;
  text: string;
  timestamp: string;
  embeds: (
    | {
        url: string;
        metadata?: {
          content_type: string;
          content_length: string;
        };
      }
    | {
        cast_id: {
          fid: number;
          hash: string;
          cast: Cast | undefined;
        };
      }
  )[];
  reactions: {
    likes_count: number;
    recasts_count: number;
    likes: {
      fid: number;
      fname: string;
    }[];
    recasts: {
      fid: number;
      fname: string;
    }[];
  };
  replies: {
    count: number;
  };
  channel: {
    id: string;
    name: string;
    image_url: string;
    object: 'channel_dehydrated';
  } | null;
  mentioned_profiles: UserProfile[];
};

type Reaction = {
  reaction_type: 'like' | 'cast';
  cast: Cast;
  reaction_timestamp: string;
  object: 'likes' | 'recasts';
};

type UserReactionsResponse = {
  reactions: Reaction[];
  next: {
    cursor: string | null;
  };
};

export async function getFarcasterUserReactions({ fid }: { fid: number }): Promise<Reaction[]> {
  const userReactionsResponse = await GET<UserReactionsResponse>(
    `${neynarBaseUrl}/reactions/user`,
    {
      fid,
      type: 'all'
    },
    {
      headers: {
        Api_key: process.env.NEYNAR_API_KEY
      }
    }
  );

  const userReactions = userReactionsResponse.reactions;

  // const embeddedFramesRecord = (
  //   await Promise.all(
  //     userReactions
  //       .map((reaction) => reaction.cast.embeds.map((embed) => ('url' in embed ? embed.url : null)).filter(isTruthy))
  //       .flat()
  //       .map((url) => getIframely({ url, darkMode: 'dark' }))
  //   )
  // ).reduce((acc, frame) => {
  //   acc[frame.url] = frame;
  //   return acc;
  // }, {} as Record<string, IframelyResponse>);

  const embeddedCasts = await getEmbeddedCasts({
    casts: userReactions.map((reaction) => reaction.cast)
  });

  return uniqBy(
    userReactions.map((reaction) => ({
      ...reaction,
      cast_key: `${reaction.object}-${reaction.cast.hash}`,
      cast: {
        ...reaction.cast,
        embeds: reaction.cast.embeds.map((embed) => {
          if ('cast_id' in embed) {
            return {
              cast_id: {
                ...embed.cast_id,
                cast: embeddedCasts.find((cast) => cast.hash === embed.cast_id.hash)!
              }
            };
          }

          return embed;
        })
      }
    })),
    'cast_key'
  );
}
