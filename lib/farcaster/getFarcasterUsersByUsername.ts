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

const neynerUrl = `https://api.neynar.com/v2/farcaster/user/search`;

export async function getFarcasterUsersByUsername(username: string) {
  const farcasterUsersResponse = await GET<FarcasterUsersResponse>(
    neynerUrl,
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
