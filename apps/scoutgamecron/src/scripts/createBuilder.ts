import { approveBuilder } from '@packages/scoutgame/builders/approveBuilder';

import { getFarcasterUserByUsername } from '@packages/farcaster/getFarcasterUserByUsername';
import { octokit } from '@packages/github/client';
import { currentSeason } from '@packages/scoutgame/dates';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { log } from '@charmverse/core/log';

process.env.DOMAIN = 'https://scoutgame.xyz';

async function createBuilder({ fid, githubLogin }: { fid: number; githubLogin: string }) {
  if (!process.env.BUILDER_SMART_CONTRACT_MINTER_PRIVKEY) {
    throw new Error('BUILDER_SMART_CONTRACT_MINTER_PRIVKEY is not set');
  }
  if (!process.env.REACT_APP_BUILDER_NFT_CONTRACT_ADDRESS) {
    throw new Error('REACT_APP_BUILDER_NFT_CONTRACT_ADDRESS is not set');
  }
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
      path: username
    },
    update: {},
    create: {
      displayName,
      path: username,
      avatar: avatarUrl,
      bio,
      builderStatus: 'applied',
      farcasterId: fid,
      farcasterName: username,
      referralCode: username + Math.random().toString().replace('.', '').slice(0, 6),
      githubUsers: githubUserDB
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
  console.log('Created a builder record', builder);
  await approveBuilder({ builderId: builder.id, season: currentSeason });
  console.log('Builder profile approved:', 'https://scoutgame.xyz/u/' + builder.path);
  process.exit(0);
}

// search farcaster id by username
// (async () => {
//   console.log(await getFarcasterUserByUsername('username'));
// })();

// search waitlist to find github login and farcaster id
// (async () => {
//   console.log(
//     await prisma.connectWaitlistSlot.findFirst({
//       where: {
//         username: 'username'
//       }
//     })
//   );
// })();

// run script to create builder
createBuilder({ fid: 111, githubLogin: 'username' });
