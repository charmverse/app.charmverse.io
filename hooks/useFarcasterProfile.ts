import useSWR from 'swr';

import * as http from 'adapters/http';

import { useUser } from './useUser';

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

export function useFarcasterProfile(fid?: number) {
  const { user } = useUser();
  const { data: farcasterProfile, isLoading } = useSWR(
    user && user.wallets.length !== 0 ? `farcaster/${user.wallets[0].address}` : fid ? `farcaster/${fid}` : null,
    async () =>
      getFarcasterProfile({
        wallets: user?.wallets?.map((wallet) => wallet.address),
        fid
      })
  );

  return {
    farcasterProfile,
    isLoading
  };
}
