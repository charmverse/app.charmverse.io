import { log } from '@packages/core/log';
import * as http from '@packages/utils/http';

import type { FarcasterUser } from './interfaces';

const userApiUrl = 'https://api.neynar.com/v2/farcaster/followers';

type FollowersResponse = {
  users: { user: FarcasterUser; object: 'follow' }[];
  next?: {
    cursor?: string;
  };
};

// ref: https://docs.neynar.com/reference/followers-v2
// note: this may take a while to run if there are many followers
export async function getFollowers(fid: number) {
  let allUsers: FarcasterUser[] = [];
  let cursor: string | undefined;

  try {
    do {
      const { next, users } = await http.GET<FollowersResponse>(
        `${userApiUrl}?fid=${fid}&limit=100${cursor ? `&cursor=${cursor}` : ''}`,
        {},
        {
          credentials: 'omit',
          headers: {
            'X-Api-Key': process.env.NEYNAR_API_KEY as string
          }
        }
      );

      allUsers = [...allUsers, ...users.map((user) => user.user)];
      cursor = next?.cursor;
    } while (cursor);
    return allUsers;
  } catch (error) {
    log.error('Error fetching followers', { usersSoFar: allUsers.length, fid, cursor, error });
    return allUsers;
  }
}
