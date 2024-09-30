import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client'
import { octokit } from '@packages/github/client';

import * as http from '@packages/utils/http';

export type FarcasterProfile = {
  username: string;
  fid: number;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    }
  }
};

const profileApiUrl = 'https://api.neynar.com/v2/farcaster/user/bulk';

export async function getFarcasterProfileById(fid: number) {
  const {users} = await http
    .GET<{users: FarcasterProfile[]}>(
      `${profileApiUrl}?fids=${fid}`,
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


const builderWaitlistLogins: string[] = []

async function createBuilders() {
  for (const login of builderWaitlistLogins) {
    const waitlistSlot = await prisma.connectWaitlistSlot.findFirst({
      where: {
        OR: [
          {
            githubLogin: login,
          },
          {
            githubLogin: login.toLowerCase(),
          }
        ]
      }
    })
    const fid = waitlistSlot?.fid;

    if (!waitlistSlot || !fid) {
      log.warn(`No waitlist slot or fid found for ${login}`)
      continue
    }

    if (waitlistSlot && fid) {
      try {
        const githubUser = await octokit.rest.users.getByUsername({ username: login })
        const profile = await getFarcasterProfileById(fid)
        if (!profile) {
          log.info(`No profile found for ${login}`)
          continue
        }
        const displayName = profile.display_name;
        const username = profile.username;
        const avatarUrl = profile.pfp_url;
        const bio = profile.profile.bio.text;
        if (!username) {
          log.info(`No username found for ${login} with fid ${fid}`)
          continue
        }
        const builder = await prisma.scout.upsert({
          where: {
            username,
          },
          update: {},
          create: {
            displayName,
            username,
            avatar: avatarUrl,
            bio,
            builderStatus: "applied",
            farcasterId: fid,
            farcasterName: displayName,
            githubUser: {
              create: {
                id: githubUser.data.id,
                login,
                displayName: githubUser.data.name,
                email: githubUser.data.email,
              }
            }
          }
        })
        log.info(`Created builder for ${login}`, { builderId: builder.id })
      } catch (error) {
        log.error(`Error creating builder for ${login}`, { error })
      }
    }
  }
}

createBuilders()