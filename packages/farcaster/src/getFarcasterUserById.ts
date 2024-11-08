import * as http from '@packages/utils/http';

import type { FarcasterUser } from './interfaces';

const userApiUrl = 'https://api.neynar.com/v2/farcaster/user/bulk';

export async function getFarcasterUserById(fid: number) {
  const users = await getFarcasterUserByIds([fid]);
  return users[0] || null;
}

export async function getFarcasterUserByIds(fids: number[]) {
  const { users } = await http.GET<{ users: FarcasterUser[] }>(`${userApiUrl}?fids=${fids}`, {
    credentials: 'omit',
    headers: {
      'X-Api-Key': process.env.NEYNAR_API_KEY as string
    }
  });
  return users;
}
