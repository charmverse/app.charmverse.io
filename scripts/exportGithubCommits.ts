import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import fs from 'fs';
import path from 'path';

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

async function query() {
  // create repo
  // const repo = await prisma.githubRepo.create({
  //   data: {
  //     id: 860028062,
  //     name: 'test-repo',
  //     owner: 'charmverse',
  //     defaultBranch: 'main'
  //   }
  // });
  // console.log(repo);

  // create scout
  // const scout = await prisma.scout.create({
  //   data: {
  //     username: 'mattbot',
  //     displayName: 'Mattbot',
  //     builder: true
  //   }
  // });
  // await prisma.githubUser.update({
  //   where: {
  //     login: 'mattcasey'
  //   },
  //   data: {
  //     builderId: scout.id
  //   }
  // });
  // console.log(scout);

  // update scout instead
  // await prisma.scout.update({
  //   where: {
  //     username: 'mattbot'
  //   },
  //   data: {
  //     builder: true
  //   }
  // });

  // console.log(await prisma.githubRepo.findMany());
  // console.log(await prisma.githubUser.findMany());
  // console.log(await prisma.githubEvent.findMany());
  const waitlists = await prisma.connectWaitlistSlot.findMany({
    where: {
      githubLogin: {
        not: null
      }
    }
  });
  const githubLogins = waitlists.map((waitlist) => waitlist.githubLogin);
  const { Octokit } = require('@octokit/rest');
  const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });

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
      await new Promise((resolve) => setTimeout(resolve, timeUntilReset + 300));
    }

    const repos = new Set<string>();
    response.data.items.forEach((item: any) => {
      repos.add(item.repository.full_name);
    });

    return {
      commitCount: response.data.total_count,
      repos: Array.from(repos)
    };
  };

  const getDateXMonthsAgo = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString().split('T')[0];
  };
  const unprocessedLogins = githubLogins.filter((login) => !processedLogins.some((row) => row.includes(login!)));
  console.log(`Processing ${unprocessedLogins.length} logins`);
  for (const login of unprocessedLogins) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekCount = await getCommitCountsAndRepos(login!, oneWeekAgo);
    const monthCount = await getCommitCountsAndRepos(login!, getDateXMonthsAgo(1));
    const threeMonthCount = await getCommitCountsAndRepos(login!, getDateXMonthsAgo(3));

    // Get the user's GitHub join date
    const userResponse = await octokit.users.getByUsername({
      username: login!
    });
    if (userResponse.headers['x-ratelimit-remaining'] === '2' && userResponse.headers['x-ratelimit-reset']) {
      const rateLimitReset = new Date(parseInt(userResponse.headers['x-ratelimit-reset']) * 1000);
      const timeUntilReset = rateLimitReset.getTime() - Date.now();
      console.log(`Waiting for profile rate limit reset: ${timeUntilReset}ms`);
      await new Promise((resolve) => setTimeout(resolve, timeUntilReset + 300));
    }
    const joinDate = userResponse.data.created_at;

    // Format the join date as YYYY-MM-DD
    const formattedJoinDate = new Date(joinDate).toISOString().split('T')[0];

    const logEntry = `${login}\t${formattedJoinDate}\t${weekCount.commitCount}\t${monthCount.commitCount}\t${
      threeMonthCount.commitCount
    }\t${threeMonthCount.repos.join(',')}`;
    appendToFile(logEntry);
    if (githubLogins.indexOf(login) % 10 === 0) {
      console.log(`Processed ${githubLogins.indexOf(login)}/${githubLogins.length} logins`);
    }
  }
  console.log('done!');
}

query();
