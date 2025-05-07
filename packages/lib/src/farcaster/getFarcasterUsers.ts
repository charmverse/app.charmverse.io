import { GET } from '@charmverse/core/http';
import { uniqBy } from 'lodash';

import { NEYNAR_API_BASE_URL, NEYNAR_API_KEY } from './constants';

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

export async function getFarcasterUsers({
  wallets,
  username,
  fids
}: {
  username?: string;
  fids?: number[];
  wallets?: string[];
}) {
  if (username) {
    const farcasterUsersResponse = await GET<FarcasterUsersResponse>(
      `${NEYNAR_API_BASE_URL}/user/search`,
      {
        q: username,
        limit: 5
      },
      {
        headers: {
          Api_key: NEYNAR_API_KEY
        }
      }
    );
    return farcasterUsersResponse.result.users;
  } else if (fids && fids.length) {
    const farcasterUsersResponse = await GET<FarcasterUserBulkResponse>(
      `${NEYNAR_API_BASE_URL}/user/bulk`,
      {
        fids: fids.join(',')
      },
      {
        headers: {
          Api_key: NEYNAR_API_KEY
        }
      }
    );
    return farcasterUsersResponse.users;
  } else if (wallets) {
    const farcasterUsersResponse = await GET<FarcasterUsersByWalletsResponse>(
      `${NEYNAR_API_BASE_URL}/user/bulk-by-address`,
      {
        addresses: wallets.join(','),
        address_types: 'custody_address,verified_address'
      },
      {
        headers: {
          Api_key: NEYNAR_API_KEY
        }
      }
    );

    const farcasterUsers = Object.values(farcasterUsersResponse);
    return uniqBy(farcasterUsers, 'fid');
  }

  return [];
}
