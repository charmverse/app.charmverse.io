import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserByUsername } from '@packages/farcaster/getFarcasterUserByUsername';

async function createScouts(farcasterUsernames: string[]) {
  for (const farcasterUsername of farcasterUsernames) {
    try {
      const profile = await getFarcasterUserByUsername(farcasterUsername);
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
          path: farcasterUsername
        },
        update: {},
        create: {
          displayName,
          referralCode: farcasterUsername + Math.random().toString().replace('.', '').slice(0, 6),
          path: farcasterUsername,
          avatar: avatarUrl,
          bio,
          farcasterId: fid,
          farcasterName: farcasterUsername,
          currentBalance: 10
        }
      });
      log.info(`Created scout for ${farcasterUsername}`, { scoutId: scout.id });
    } catch (error) {
      log.error(`Error creating scout for ${farcasterUsername}`, { error });
    }
  }
}

createScouts(['sky']);
