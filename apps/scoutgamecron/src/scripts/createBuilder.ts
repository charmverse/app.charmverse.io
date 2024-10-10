import { approveBuilder } from './approveBuilder';

import { getFarcasterUserByUsername } from '@packages/farcaster/getFarcasterUserByUsername';
import { octokit } from '@packages/github/client';
import { currentSeason } from '@packages/scoutgame/dates';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { log } from '@charmverse/core/log';
import { importReposByUser } from '@packages/scoutgame/importReposByUser';

process.env.DOMAIN = 'https://scoutgame.xyz';

async function createBuilder({ fid, githubLogin }: { fid: number; githubLogin: string }) {
  const githubUser = await octokit.rest.users.getByUsername({ username: githubLogin });
  const profile = await getFarcasterUserById(fid);
  if (!profile) {
    log.info(`No farcaster profile found for ${githubLogin}`);
    return;
  }
  const displayName = profile.display_name;
  const username = profile.username;
  const avatarUrl = profile.pfp_url;
  const bio = profile.profile.bio.text;
  if (!username) {
    log.info(`No username found for ${githubLogin} with fid ${fid}`);
    return;
  }
  const githubUserDB = await prisma.githubUser.findUnique({
    where: {
      id: githubUser.data.id
    }
  });
  // if (githubUserDB?.builderId) {
  //   log.info(`Builder already exists for ${githubLogin}`);
  //   return;
  // }
  const builder = await prisma.scout.upsert({
    where: {
      username
    },
    update: {},
    create: {
      displayName,
      username,
      avatar: avatarUrl,
      bio,
      builderStatus: 'applied',
      farcasterId: fid,
      farcasterName: displayName,
      githubUser: githubUserDB
        ? { connect: { id: githubUserDB.id } }
        : {
            create: {
              id: githubUser.data.id,
              login: githubLogin,
              displayName: githubUser.data.name,
              email: githubUser.data.email
            }
          }
    }
  });
  console.log('builder created', builder);
  // await importReposByUser(githubLogin);
  await approveBuilder({ builderId: builder.id, season: currentSeason });
}

createBuilder({ fid: 4179, githubLogin: 'Maurelian' });

// use this to search farcaster id by username
// (async () => {
//   const user = await getFarcasterUserByUsername('txbi');
//   console.log('user', user);
// })();

// use this to import repos for an org
// (async () => {
//   // await importReposByUser('TogetherCrew');
// })();
