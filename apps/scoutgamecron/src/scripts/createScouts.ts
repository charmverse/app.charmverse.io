import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import * as http from '@packages/utils/http';

export type FarcasterProfile = {
  username: string;
  fid: number;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    };
  };
};

const profileApiUrl = 'https://api.neynar.com/v2/farcaster/user/search';

export async function getFarcasterProfileByUsername(username: string) {
  const {
    result: { users }
  } = await http.GET<{ result: { users: FarcasterProfile[] } }>(
    `${profileApiUrl}?q=${username}&limit=1`,
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

const farcasterUsernames: string[] = [];

async function createBuilders() {
  for (const farcasterUsername of farcasterUsernames) {
    try {
      const profile = await getFarcasterProfileByUsername(farcasterUsername);
      if (!profile) {
        log.info(`No profile found for ${farcasterUsername}`);
        continue;
      }
      const displayName = profile.display_name;
      const avatarUrl = profile.pfp_url;
      const bio = profile.profile.bio.text;
      const fid = profile.fid;

      const scout = await prisma.scout.upsert({
        where: {
          username: farcasterUsername
        },
        update: {},
        create: {
          displayName,
          username: farcasterUsername,
          avatar: avatarUrl,
          bio,
          farcasterId: fid,
          farcasterName: displayName
        }
      });
      log.info(`Created scout for ${farcasterUsername}`, { scoutId: scout.id });
    } catch (error) {
      log.error(`Error creating scout for ${farcasterUsername}`, { error });
    }
  }
}

createBuilders();
