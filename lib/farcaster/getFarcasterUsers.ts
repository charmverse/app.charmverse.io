import { GET } from '@charmverse/core/http';
import { uniqBy } from 'lodash';

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

type FarcasterUserBulkResponse = {
  users: FarcasterUser[];
};

type FarcasterUsersByWalletsResponse = {
  [address: string]: FarcasterUser;
};

const neynarBaseUrl = 'https://api.neynar.com/v2/farcaster';

export async function getFarcasterUsers({
  wallets,
  username,
  fid
}: {
  username?: string;
  fid?: number;
  wallets?: string[];
}) {
  if (username) {
    const farcasterUsersResponse = await GET<FarcasterUsersResponse>(
      `${neynarBaseUrl}/user/search`,
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
  } else if (fid) {
    const farcasterUsersResponse = await GET<FarcasterUserBulkResponse>(
      `${neynarBaseUrl}/user/bulk`,
      {
        fids: fid
      },
      {
        headers: {
          Api_key: process.env.NEYNAR_API_KEY
        }
      }
    );
    return farcasterUsersResponse.users;
  } else if (wallets) {
    const farcasterUsersResponse = await GET<FarcasterUsersByWalletsResponse>(
      `${neynarBaseUrl}/user/bulk-by-address`,
      {
        addresses: wallets.join(','),
        address_types: 'custody_address,verified_address'
      },
      {
        headers: {
          Api_key: process.env.NEYNAR_API_KEY
        }
      }
    );

    const farcasterUsers = Object.values(farcasterUsersResponse);
    return uniqBy(farcasterUsers, 'fid');
  }

  return [];
}
