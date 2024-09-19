import { GithubRepo, GithubUser, prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { PullRequest } from '../tasks/processPullRequests/getPullRequests';
import { processClosedPullRequest } from '../tasks/processPullRequests/processClosedPullRequest';
import { processMergedPullRequest } from '../tasks/processPullRequests/processMergedPullRequest';
import { v4 } from 'uuid';
import { log } from '@charmverse/core/log';
import { timezone } from '@packages/scoutgame/utils';

async function generateScout(params: { isBuilder: boolean } = { isBuilder: false }) {
  const { isBuilder } = params;
  const username = faker.internet.userName();
  const displayName = `${faker.person.firstName()} ${faker.person.lastName()}`;
  const email = faker.datatype.boolean() ? faker.internet.email() : undefined;
  const avatar = faker.datatype.boolean() ? faker.image.avatar() : undefined;

  const githubUser = isBuilder ? {
    id: faker.number.int({ min: 100000, max: 10000000 }),
    login: username,
    email,
    displayName
  } : undefined

  const scout = await prisma.scout.create({
    data: {
      username,
      displayName,
      email,
      avatar,
      bio: faker.lorem.paragraph(),
      agreedToTOS: true,
      onboarded: true,
      walletAddress: faker.finance.ethereumAddress(),
      farcasterId: faker.number.int({ min: 1, max: 5000 }),
      farcasterName: displayName,
      builder: isBuilder,
      githubUser: isBuilder
        ? {
            create: githubUser
          }
        : undefined
    }
  });

  return {
    scout,
    githubUser
  };
}

async function generateBuilder() {
  const {scout, githubUser} = await generateScout({ isBuilder: true });

  return {
    builder: scout,
    githubUser: githubUser as GithubUser
  };
}

function assignReposToBuilder(githubRepos: GithubRepo[]): GithubRepo[] {
  const repoCount = faker.number.int({ min: 3, max: 5 });
  return faker.helpers.arrayElements(githubRepos, repoCount);
}

async function generateGithubRepos(totalGithubRepos: number): Promise<[GithubRepo[], Map<number, number>]> {
  const githubRepos: GithubRepo[] = [];
  const repoPRCounters = new Map<number, number>();

  for (let i = 0; i < totalGithubRepos; i++) {
    const githubRepo = await prisma.githubRepo.create({
      data: {
        id: i + 1,
        owner: faker.internet.userName(),
        name: faker.internet.domainName(),
        defaultBranch: 'main'
      }
    });
    githubRepos.push(githubRepo);
    repoPRCounters.set(githubRepo.id, 0);
  }

  return [githubRepos, repoPRCounters];
}

function generatePullRequest(
  githubRepo: GithubRepo,
  githubUser: GithubUser,
  pullRequestNumber: number,
  day: number,
  closedPullRequestChance: number
): PullRequest {
  const nameWithOwner = `${githubRepo.owner}/${githubRepo.name}`;
  return {
    baseRefName: 'main',
    author: {
      id: githubUser.id,
      login: githubUser.login,
    },
    title: faker.lorem.sentence(),
    url: `https://github.com/${nameWithOwner}/pull/${pullRequestNumber}`,
    createdAt: DateTime.fromJSDate(new Date(new Date().setDate(day - 1)), {zone: timezone}).toISO(),
    mergedAt: DateTime.fromJSDate(new Date(new Date().setDate(day)), {zone: timezone}).toISO(),
    number: pullRequestNumber,
    repository: {
      id: githubRepo.id,
      nameWithOwner
    },
    state: faker.number.int({min: 1, max: 100}) <= closedPullRequestChance ? 'CLOSED' : 'MERGED'
  };
}

async function processPullRequest(pullRequest: PullRequest, githubRepo: GithubRepo) {
  if (pullRequest.state === 'CLOSED') {
    await processClosedPullRequest({
      pullRequest,
      repo: githubRepo,
      prClosedBy: v4()
    });
  } else if (pullRequest.state === 'MERGED') {
    await processMergedPullRequest({
      pullRequest,
      repo: githubRepo,
      isFirstMergedPullRequest: false,
    });
  }
}

async function generateBuilderEvents(
  githubUser: GithubUser,
  githubRepos: GithubRepo[],
  repoPRCounters: Map<number, number>
) {
  const closedPullRequestChance = faker.number.int({ min: 10, max: 20 });
  const weekDay = DateTime.fromJSDate(new Date(), {zone: timezone}).weekday % 7;

  for (let day = 0; day <= weekDay; day++) {
    const dailyGithubEvents = faker.number.int({ min: 3, max: 5 });
    for (let j = 0; j < dailyGithubEvents; j++) {
      const githubRepo = faker.helpers.arrayElement(githubRepos);
      const pullRequestNumber = repoPRCounters.get(githubRepo.id)! + 1;
      repoPRCounters.set(githubRepo.id, pullRequestNumber);

      const pullRequest = generatePullRequest(githubRepo, githubUser, pullRequestNumber, day, closedPullRequestChance);
      await processPullRequest(pullRequest, githubRepo);
    }
  }
}

export async function generateSeedData() {
  const builderPercentage = faker.number.int({ min: 20, max: 50 });
  const totalUsers = faker.number.int({ min: 100, max: 250 });
  const totalBuilders = Math.floor(totalUsers * builderPercentage / 100);
  const totalGithubRepos = faker.number.int({ min: 100, max: 250 });

  const [githubRepos, repoPRCounters] = await generateGithubRepos(totalGithubRepos);

  for (let i = 0; i < totalBuilders; i++) {
    const {githubUser} = await generateBuilder();
    // Realistically a builder will only send PR to a few repos not any arbitrary ones
    const assignedRepos = assignReposToBuilder(githubRepos);
    await generateBuilderEvents(githubUser, assignedRepos, repoPRCounters);
  }

  for (let i = 0; i < totalUsers - totalBuilders; i++) {
    await generateScout();
  }

  log.info('generated seed data', {
    totalUsers,
    totalBuilders,
    totalGithubRepos,
    totalScouts: totalUsers - totalBuilders
  });
}

generateSeedData();