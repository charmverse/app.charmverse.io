import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit } from '@octokit/rest';

Octokit.plugin(throttling);

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
  throttle: {
    // @ts-ignore
    onRateLimit: (retryAfter, options, _octokit, retryCount) => {
      console.log(`[Octokit] Request quota exhausted for request ${options.method} ${options.url}`);

      console.log(`[Octokit] Retrying after ${retryAfter} seconds!`);
      return true;
      // if (retryCount < 2) {
      //   // only retries twice
      //   return true;
      // }
    },
    // @ts-ignore
    onSecondaryRateLimit: (retryAfter, options, _octokit) => {
      // does not retry, only logs a warning
      console.log(
        `[Octokit] SecondaryRateLimit detected for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds!`
      );
      // try again
      return true;
    }
  }
});

// create a file with headers for the columns

// Append the result to a file
const filename = `github_commits_${new Date().toISOString().split('T')[0]}.tsv`;
const filePath = path.join(__dirname, '..', filename);

if (!fs.existsSync(filename)) {
  fs.writeFileSync(filename, 'login\tjoin date\tlast week\tlast month\tlast three months\trepos\n');
}

const appendToFile = (data: string) => {
  fs.appendFileSync(filename, data + '\n');
};
// filter githubLogins that have already been processed
const processedLogins = fs.readFileSync(filePath, 'utf8').split('\n');

const getCommitCountsAndRepos = async (username: string, since: string) => {
  const response = await octokit.search.commits({
    q: `author:${username} author-date:>${since}`,
    per_page: 100
  });
  if (response.headers['x-ratelimit-remaining'] === '2' && response.headers['x-ratelimit-reset']) {
    const rateLimitReset = new Date(parseInt(response.headers['x-ratelimit-reset']) * 1000);
    // wait until rate limit reset
    const timeUntilReset = rateLimitReset.getTime() - Date.now();
    console.log(`Waiting for rate limit reset: ${timeUntilReset}ms`);
    await new Promise((resolve) => setTimeout(resolve, timeUntilReset + 2000));
  }

  const repos = new Set<string>();
  response.data.items.forEach((item: any) => {
    repos.add(item.repository.full_name);
  });

  return {
    items: response.data.items,
    commitCount: response.data.total_count,
    repos: Array.from(repos)
  };
};

async function query() {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      githubUser: {
        some: {}
      }
    },
    select: {
      githubUser: {
        select: {
          id: true,
          login: true
        }
      }
    }
  });
  // get the commits for each builder since monday this week

  const mondayThisWeek = '2024-09-29';
  const results = [];

  for (const builder of builders) {
    const login = builder.githubUser[0].login;
    if (processedLogins.includes(login)) {
      console.log(`Skipping ${login} as it has already been processed.`);
      continue;
    }

    console.log(`Processing ${login}...`);

    // Process commit data
    const commitData = await getCommitCountsAndRepos(login, mondayThisWeek);

    const dailyCommits: Record<string, number> = {};
    commitData.items.forEach((commit) => {
      const commitDate = DateTime.fromISO(commit.commit.author.date, { zone: 'utc' }).toISODate();
      dailyCommits[commitDate] = (dailyCommits[commitDate] || 0) + 1;
    });

    results.push({ login, dailyCommits, totalCommits: Object.keys(dailyCommits).length }); //, totalCommits: commitCount, repos });
    // appendToFile(`${login}\t${JSON.stringify(dailyCommits)}\t${commitCount}\t${repos.join(',')}`);

    console.log(
      `Processed ${login}. Total commits: ${commitData.items.length} // Total gems: ${Object.keys(dailyCommits).length}`
    );
    if (builders.indexOf(builder) % 20 === 0) {
      console.log(
        'Processed',
        builders.indexOf(builder),
        'builders. Builders with commits so far:',
        results.filter((r) => r.totalCommits > 0).length
      );
    }
  }
  console.log(
    'Results:',
    results.sort((a, b) => b.totalCommits - a.totalCommits).filter((a) => a.totalCommits > 0)
  );
  console.log('builders with commits', results.filter((r) => r.totalCommits > 0).length);
  // for (const builder of builders) {
  //   const { commitCount, repos } = await getCommitCountsAndRepos(builder.githubUser[0].login, '2024-09-29');
  // }
  // console.log('done!');
}

query();
