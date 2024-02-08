import * as http from 'adapters/http';

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

export async function getFarcasterProfile({ wallets = [], fid }: { fid?: number; wallets?: string[] }) {
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

  [_farcasterProfile] = await http.GET<FarcasterProfile[]>(
    `${profileApiUrl}?fid=${fid}`,
    {},
    {
      credentials: 'omit'
    }
  );

  return _farcasterProfile;
}
