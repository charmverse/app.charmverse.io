import * as http from '@packages/utils/http';

import type { FarcasterUser } from './interfaces';

const userApiUrl = 'https://api.neynar.com/v2/farcaster/user/bulk';

export async function getFarcasterUserById(fid: number) {
  const { users } = await http.GET<{ users: FarcasterUser[] }>(
    `${userApiUrl}?fids=${fid}`,
    {},
    {
      credentials: 'omit',
      headers: {
        'X-Api-Key': process.env.NEYNAR_API_KEY as string
      }
    }
  );
  return users[0] || null;
}
