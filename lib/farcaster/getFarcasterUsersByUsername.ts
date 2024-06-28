import { GET } from 'adapters/http';

export type FarcasterUser = {
  object: string;
  fid: number;
  custody_address: string;
  username: string;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
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

type FarcasterUsersResponse = {
  result: {
    users: FarcasterUser[];
    next: {
      cursor: null | string;
    };
  };
};

const neynarBaseUrl = `https://api.neynar.com/v2`;

export async function getFarcasterUsersByUsername(username: string) {
  const farcasterUsersResponse = await GET<FarcasterUsersResponse>(
    `${neynarBaseUrl}/farcaster/user/search`,
    {
      q: username,
      limit: 5
    },
    {
      headers: {
        Api_key: process.env.NEYNAR_API_KEY
      }
    }
  );

  return farcasterUsersResponse.result.users;
}
