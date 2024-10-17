import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import fs from 'fs';
import path from 'path';
import { uniq } from 'lodash';
import { throttling } from '@octokit/plugin-throttling';
const { Octokit } = require('@octokit/rest');

const MyOctokit = Octokit.plugin(throttling);

const octokit = new MyOctokit({
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
const filename = `github_prs_${new Date().toISOString().split('T')[0]}.tsv`;
const filePath = path.join(__dirname, '..', filename);

if (!fs.existsSync(filename)) {
  fs.writeFileSync(filename, 'title\tevent\tuser\trepo owner\trepo name\tlink\tcreated\n');
}

const appendToFile = (data: string) => {
  fs.appendFileSync(filename, data + '\n');
};
// filter githubLogins that have already been processed
const processedLogins = fs.readFileSync(filePath, 'utf8').split('\n');
console.log(processedLogins.length);
console.log(uniq(processedLogins).length);
fs.writeFileSync('github_activity_10_14.tsv', uniq(processedLogins).join('\n'));
async function query() {
  const waitlistRecords = await prisma.connectWaitlistSlot.findMany({
    where: {
      githubLogin: {
        not: null
      }
    },
    orderBy: {
      percentile: 'desc'
    },
    select: {
      fid: true,
      username: true,
      githubLogin: true,
      percentile: true
    }
  });
  const builders = await prisma.githubUser.findMany({
    where: {
      login: {
        in: waitlistRecords.map((r) => r.githubLogin).filter(Boolean)
      }
    }
  });
  const newBuilders = waitlistRecords.filter((r) => !builders.some((b) => b.builderId && b.login === r.githubLogin));
  // const newBuildersD = newBuilders.filter((r) => !processedLogins.some((row) => row.includes(r.githubLogin)));

  const oneWeekAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  async function getPullRequestsForUser(username: string) {
    try {
      const { data } = await octokit.search.issuesAndPullRequests({
        q: `is:pr author:${username} created:>=${oneWeekAgo}`,
        per_page: 100
      });

      return data.items;
    } catch (error) {
      console.error(`Error fetching pull requests for ${username}:`, error);
      return [];
    }
  }
  async function getCommitsForUser(username: string) {
    const response = await octokit.search.commits({
      q: `author:${username} author-date:>${oneWeekAgo}`,
      per_page: 100
    });
    if (response.data.items.length === 100) {
      console.log(`${username} has more than 100 commits, skipping`);
      return { data: { items: [] } };
    }
    return response;
  }

  const pullRequestsPerUser: any[] = [];
  for (const record of newBuilders) {
    const login = record.githubLogin;
    const pullRequests = await getPullRequestsForUser(login!);
    // console.log(pullRequests[0]);
    pullRequestsPerUser.push({ login, pullRequests });
    // add each pull request to the file, with columns for builder, date, repo, repo owner
    for (const pullRequest of pullRequests) {
      const repoOwner = pullRequest.html_url.replace('https://github.com/', '').split('/pull/')[0];
      const [owner, name] = repoOwner.split('/');
      const logEntry = `${pullRequest.title}\tpr\t${login}\t${owner}\t${name}\t${pullRequest.html_url}\t${pullRequest.created_at}`;
      appendToFile(logEntry);
    }
    const commits = await getCommitsForUser(login!);
    for (const commit of commits.data.items) {
      const logEntry = `${commit.commit.message.split('\n')[0]}\tcommit\t${login}\t${commit.repository.owner.login}\t${commit.repository.name}\t${commit.html_url}\t${commit.commit.author.date}`;
      appendToFile(logEntry);
    }
    console.log(
      `#${newBuilders.indexOf(record) + 1} ${record.percentile} ${login}: ${pullRequests.length} pull requests and ${commits.data.items.length} commits. `
    );
  }

  console.log('done!');
}

// query();
