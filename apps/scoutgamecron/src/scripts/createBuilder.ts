import { approveBuilder } from './approveBuilder';

import { getFarcasterUserByUsername } from '@packages/farcaster/getFarcasterUserByUsername';
import { octokit } from '@packages/github/client';
import { currentSeason } from '@packages/scoutgame/dates';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { log } from '@charmverse/core/log';

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

async function importReposByUser(githubLogin: string) {
  const repos = await getReposForOwner(githubLogin);
  // retrieve a list of all the owners we have in the gitRepo database
  const reposInDBByOwner = await prisma.githubRepo.findMany({
    where: {
      owner: githubLogin
    },
    select: {
      id: true,
      owner: true,
      name: true
    }
  });
  if (reposInDBByOwner.length > 0) {
    console.log(
      'found existing repos for owner',
      githubLogin,
      reposInDBByOwner.map((r) => r.name)
    );
  }
  const reposInDBById = await prisma.githubRepo.findMany({
    where: {
      id: {
        in: repos.map((r) => r.id)
      }
    }
  });
  const reposInDB = [...reposInDBById, ...reposInDBByOwner];
  const isOrg = repos.some((repo: any) => repo.owner.type === 'Organization');
  const notSaved = repos.filter((repo: any) => !reposInDB.some((r) => r.name === repo.name || r.id === repo.id));
  // save to DB
  if (notSaved.length > 0) {
    await prisma.githubRepo.createMany({
      data: notSaved.map((repo) => ({
        id: repo.id,
        owner: repo.owner.login,
        defaultBranch: repo.default_branch,
        name: repo.name,
        ownerType: isOrg ? 'org' : 'user',
        fork: repo.fork
      }))
    });
    console.log(
      `Imported new repos from ${githubLogin}:`,
      notSaved.map((r) => r.name)
    );
  }
}

type Repo = { id: number; default_branch: string; name: string; fork: boolean; owner: { login: string; type: string } };

// Function to fetch repos for a given owner
async function getReposForOwner(owner: string) {
  let allRepos: Repo[] = [];
  let page = 1;
  const perPage = 100; // GitHub's max per page
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await fetch(`https://api.github.com/users/${owner}/repos?page=${page}&per_page=${perPage}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const repos = await response.json();
    allRepos = allRepos.concat(repos);

    // Check if there's a next page
    const linkHeader = response.headers.get('Link');
    hasNextPage = !!linkHeader && linkHeader.includes('rel="next"');
    page++;

    // Add a small delay to avoid hitting rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return allRepos;
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
