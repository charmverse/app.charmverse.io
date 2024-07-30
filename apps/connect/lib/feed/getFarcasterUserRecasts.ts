import { GET } from '@root/adapters/http';
import { getFarcasterUsers, type FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';
import { uniqBy } from 'lodash';

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

type Reaction = {
  fid: number;
  fname: string;
};

export type Recast = {
  object: 'recast';
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
          content_length: null | number;
        };
      }
    | {
        cast_id: {
          fid: number;
          hash: string;
        };
      }
  )[];
  reactions: {
    likes_count: number;
    recasts_count: number;
    likes: Reaction[];
    recasts: Reaction[];
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

type RepliesAndRecastsResponse = {
  casts: Recast[];
  next: {
    cursor: string | null;
  };
};

export async function getFarcasterUserRecasts(): Promise<Recast[]> {
  const [charmverseProfile] = await getFarcasterUsers({
    fids: [1501]
  });
  const userRecasts = await GET<RepliesAndRecastsResponse>(
    `${neynarBaseUrl}/feed/user/replies_and_recasts`,
    {
      filter: 'recasts',
      fid: 1501
    },
    {
      headers: {
        Api_key: process.env.NEYNAR_API_KEY
      }
    }
  );

  return uniqBy(
    userRecasts.casts.map((recast) => ({
      ...recast,
      object: 'recast',
      parent_author: charmverseProfile
    })),
    'hash'
  );
}
