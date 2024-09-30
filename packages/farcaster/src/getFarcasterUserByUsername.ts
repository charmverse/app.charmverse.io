import * as http from '@packages/utils/http';

import type { FarcasterUser } from './interfaces';

const userApiUrl = 'https://api.neynar.com/v2/farcaster/user/search';

export async function getFarcasterUserByUsername(username: string) {
  const {
    result: { users }
  } = await http.GET<{ result: { users: FarcasterUser[] } }>(
    `${userApiUrl}?q=${username}&limit=1`,
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
