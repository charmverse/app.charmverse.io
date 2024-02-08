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

export function useFarcasterProfile() {
  const { user } = useUser();
  const { data: farcasterProfile, isLoading } = useSWR(
    user && user.wallets.length !== 0 ? `farcaster/${user.wallets[0].address}` : null,
    async () => {
      for (const wallet of user!.wallets) {
        let [_farcasterProfile] = await http.GET<FarcasterProfile[]>(
          `https://searchcaster.xyz/api/profiles?connected_address=${wallet.address}`,
          {},
          {
            credentials: 'omit'
          }
        );
        if (!_farcasterProfile) {
          [_farcasterProfile] = await http.GET<FarcasterProfile[]>(
            `https://searchcaster.xyz/api/profiles?address=${wallet.address}`,
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

      return null;
    }
  );

  return {
    farcasterProfile,
    isLoading
  };
}
