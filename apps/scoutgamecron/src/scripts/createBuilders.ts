import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { octokit } from '@packages/github/client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';

const builderWaitlistLogins: string[] = [];

async function createBuilders() {
  for (const login of builderWaitlistLogins) {
    const waitlistSlot = await prisma.connectWaitlistSlot.findFirst({
      where: {
        OR: [
          {
            githubLogin: login
          },
          {
            githubLogin: login.toLowerCase()
          }
        ]
      }
    });
    const fid = waitlistSlot?.fid;

    if (!waitlistSlot || !fid) {
      log.warn(`No waitlist slot or fid found for ${login}`);
      continue;
    }

    if (waitlistSlot && fid) {
      try {
        const githubUser = await octokit.rest.users.getByUsername({ username: login });
        const profile = await getFarcasterUserById(fid);
        if (!profile) {
          log.info(`No profile found for ${login}`);
          continue;
        }
        const displayName = profile.display_name;
        const username = profile.username;
        const avatarUrl = profile.pfp_url;
        const bio = profile.profile.bio.text;
        if (!username) {
          log.info(`No username found for ${login} with fid ${fid}`);
          continue;
        }
        const builder = await prisma.scout.upsert({
          where: {
            path: username
          },
          update: {},
          create: {
            displayName,
            referralCode: username + Math.random().toString().replace('.', '').slice(0, 6),
            path: username,
            avatar: avatarUrl,
            bio,
            builderStatus: 'applied',
            farcasterId: fid,
            farcasterName: username,
            githubUser: {
              create: {
                id: githubUser.data.id,
                login,
                displayName: githubUser.data.name,
                email: githubUser.data.email
              }
            }
          }
        });
        log.info(`Created builder for ${login}`, { builderId: builder.id });
      } catch (error) {
        log.error(`Error creating builder for ${login}`, { error });
      }
    }
  }
}

createBuilders();
