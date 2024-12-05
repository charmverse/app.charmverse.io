import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
const currentSeason = currentSeasonStartDate.toFormat(`kkkk-'W'WW`);

async function getThisWeeksPrs() {
  // const w = await prisma.githubUser.findMany({
  //   where: {
  //     builderId: null
  //   }
  // });
  // prettyPrint(w.length);
  const githubEvents = await prisma.githubEvent.findMany({
    select: {
      title: true,
      githubUser: {
        select: {
          login: true,
          builderId: true
        }
      },
      repo: {
        select: {
          owner: true,
          name: true
        }
      },
      completedAt: true
    }
  });

  console.log('Found', githubEvents.length, 'PRs');

  const tsvContent = [
    ['PR title', 'Repo Name', 'Repo Owner', 'GitHub User', 'Merged', 'Is Scout Builder'].join('\t'),
    ...githubEvents.map((event) =>
      [
        event.title,
        event.repo.name,
        event.repo.owner,
        event.githubUser?.login || 'N/A',
        event.completedAt?.toISOString(),
        event.githubUser?.builderId ? 'Yes' : 'No'
      ].join('\t')
    )
  ].join('\n');

  const fs = require('fs');
  fs.writeFileSync('github_events.tsv', tsvContent);
  console.log('TSV file has been generated: github_events.tsv');
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

async function getRepos() {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved'
    },
    select: {
      githubUsers: true
    }
  });
  const uniqueOwners = builders.map((builder) => builder.githubUsers[0].login);
  // retrieve a list of all the owners we have in the gitRepo database
  const owners = await prisma.githubRepo.findMany({
    where: {
      owner: {
        in: uniqueOwners
      }
    },
    select: {
      owner: true,
      name: true
    }
  });
  console.log('found owners', owners.length);
  const unprocessedOwners = uniqueOwners.filter((owner) => !owners.some((r) => r.owner === owner));
  console.log('builder owners', uniqueOwners.length);
  console.log('unprocessedOwners', unprocessedOwners.length);
  // return;
  let totalNotSaved = 0;
  // Fetch repos for each unique owner
  for (const owner of unprocessedOwners) {
    try {
      const repos = await getReposForOwner(owner);
      const isOrg = repos.some((repo: any) => repo.owner.type === 'Organization');
      const notSaved = repos.filter((repo: any) => !owners.some((owner) => owner.name === repo.name));
      console.log(`Repos for ${owner}:`, repos.length, 'Not saved:', notSaved.length);
      notSaved.forEach((repo: any) => {
        // console.log(`- ${repo.name} ${repo.fork}`);
      });
      totalNotSaved += notSaved.length;
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
      }
      // repos.forEach((repo: any) => {
      //   console.log(`- ${repo.name}`);
      // });
    } catch (error) {
      console.error(`Error creating repos for ${owner}:`, error);
    }
    if (uniqueOwners.indexOf(owner) % 50 === 0) {
      console.log('🔥 Processed', uniqueOwners.indexOf(owner), 'of', uniqueOwners.length);
    }
    // add a delay to avoid being rate limited
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.log('totalNotSaved', totalNotSaved);
}

async function query() {
  console.log(
    await prisma.scout.findFirst({
      where: {
        farcasterId: 828
      }
    })
  );
}

// query();
// getThisWeeksPrs();
getRepos();
//query();
