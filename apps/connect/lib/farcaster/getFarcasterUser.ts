import { GET } from 'adapters/http';

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

export async function getFarcasterProfile({ username, fid }: { username?: string; fid?: number | string }) {
  let _farcasterProfile: FarcasterProfile | null = null;
  const numericFid = typeof fid === 'string' ? Number.parseInt(fid, 10) : fid;
  if (!_farcasterProfile && numericFid) {
    [_farcasterProfile] = await GET<FarcasterProfile[]>(
      `${profileApiUrl}?fid=${numericFid}`,
      {},
      {
        credentials: 'omit'
      }
    );
  }

  if (username && !_farcasterProfile) {
    [_farcasterProfile] = await GET<FarcasterProfile[]>(
      `${profileApiUrl}?username=${username}`,
      {},
      {
        credentials: 'omit'
      }
    );
  }

  return _farcasterProfile;
}
