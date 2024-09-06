import * as http from '@root/adapters/http';

export type FarcasterProfile = {
  body: {
    id: number;
    address: string;
    username: string;
    displayName: string;
    bio: string;
    followers: number;
    following: number;
    avatarUrl: string;
    isVerifiedAvatar: boolean;
    registeredAt: number;
  };
  connectedAddress: string;
  connectedAddresses: string[];
};

const profileApiUrl = 'https://searchcaster.xyz/api/profiles';

export async function getFarcasterProfile({
  username,
  wallets = [],
  fid
}: {
  username?: string;
  fid?: number | string;
  wallets?: string[];
}) {
  const numericFid = typeof fid === 'string' ? Number.parseInt(fid, 10) : fid;
  let _farcasterProfile: FarcasterProfile | null = null;

  for (const wallet of wallets) {
    [_farcasterProfile] = await http.GET<FarcasterProfile[]>(
      `${profileApiUrl}?connected_address=${wallet}`,
      {},
      {
        credentials: 'omit'
      }
    );
    if (!_farcasterProfile) {
      [_farcasterProfile] = await http.GET<FarcasterProfile[]>(
        `${profileApiUrl}?address=${wallet}`,
        {},
        {
          credentials: 'omit'
        }
      );
    }
    if (_farcasterProfile) {
      return _farcasterProfile;
    }
  }

  if (!_farcasterProfile && numericFid) {
    _farcasterProfile = await getFarcasterProfileById(numericFid);

    if (_farcasterProfile) {
      return _farcasterProfile;
    }
  }

  if (username && !_farcasterProfile) {
    [_farcasterProfile] = await http.GET<FarcasterProfile[]>(
      `${profileApiUrl}?username=${username}`,
      {},
      {
        credentials: 'omit'
      }
    );
  }

  return _farcasterProfile;
}

export function getFarcasterProfileById(fid: number) {
  return http
    .GET<FarcasterProfile[]>(
      `${profileApiUrl}?fid=${fid}`,
      {},
      {
        credentials: 'omit'
      }
    )
    .then((profiles) => profiles[0] || null);
}
