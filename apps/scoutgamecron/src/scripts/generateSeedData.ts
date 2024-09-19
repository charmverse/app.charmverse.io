import { GithubRepo, prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { timezone } from '@packages/scoutgame/utils';
import { PullRequest } from '../tasks/processPullRequests/getPullRequests';
import { processClosedPullRequest } from '../tasks/processPullRequests/processClosedPullRequest';
import { processMergedPullRequest } from '../tasks/processPullRequests/processMergedPullRequest';
import { v4 } from 'uuid';

async function generateScout({ isBuilder }: { isBuilder: boolean }) {
  const displayName = faker.name.fullName();
  const username = faker.internet.userName();
  const email = faker.internet.email();
  const avatar = faker.image.avatar();

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
            create: {
              id: faker.number.int({ min: 100000, max: 10000000 }),
              login: username,
              email,
              displayName
            }
          }
        : undefined
    }
  });

  return scout;
}

function generateBuilder() {
  return generateScout({ isBuilder: true });
}

export async function generateSeedData() {
  // 20 - 50 percent builders out of all the users
  const builderPercentage = faker.number.int({ min: 20, max: 50 });
  const totalUsers = faker.number.int({ min: 100, max: 250 });
  const totalBuilders = Math.floor(totalUsers * builderPercentage);

  // 100 - 250 github repos
  const totalGithubRepos = faker.number.int({ min: 100, max: 250 });

  const githubRepos: GithubRepo[] = []

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
  }

  for (let i = 0; i < totalBuilders; i++) {
    const builder = await generateBuilder();
    // between 10 and 20 percent chance of a closed pull request for this specific builder
    const closedPullRequestChance = faker.number.int({ min: 10, max: 20 });

    const githubUser = await prisma.githubUser.findFirstOrThrow({
      where: {
        login: builder.username
      }
    });
    // generate events for the week
    const weekDay = DateTime.fromJSDate(new Date(), {zone: timezone}).weekday % 7;
    for (let day = 0; day <= weekDay; day++) {
      const dailyGithubEvents = faker.number.int({ min: 3, max: 5 });
      for (let i = 0; i < dailyGithubEvents; i++) {
        const githubRepo = faker.helpers.arrayElement(githubRepos);
        const pullRequestNumber = faker.number.int({min: 1, max: 1000});
        const pullRequest: PullRequest = {
          baseRefName: 'main',
          author: {
            id: githubUser.id,
            login: githubUser.login,
          },
          title: faker.lorem.sentence(),
          url: `https://github.com/${githubRepo.owner}/${githubRepo.name}/pull/${pullRequestNumber}`,
          // Pull request created one day before the current day
          createdAt: DateTime.fromJSDate(new Date(new Date().setDate(day - 1)), {zone: timezone}).toISO(),
          // Pull request merged on the current day
          mergedAt: DateTime.fromJSDate(new Date(new Date().setDate(day)), {zone: timezone}).toISO(),
          number: pullRequestNumber,
          repository: {
            id: githubRepo.id,
            nameWithOwner: `${githubRepo.owner}/${githubRepo.name}`
          },
          state: faker.number.int({min: 1, max: 100}) <= closedPullRequestChance ? 'CLOSED' : 'MERGED'
        }

        if (pullRequest.state === 'CLOSED') {
          await processClosedPullRequest({
            pullRequest,
            repo: githubRepo,
            // Use a random github user login to avoid triggering the check to see if the author closed the PR
            prClosedBy: v4()
          })
        } else if (pullRequest.state === 'MERGED') {
          await processMergedPullRequest({
            pullRequest,
            repo: githubRepo,
            // Manually mark this pull request as not the first merged pull request to avoid calling the Github API
            isFirstMergedPullRequest: false,
          })
        }
      }
    }
  }

  for (let i = 0; i < totalUsers - totalBuilders; i++) {
    await generateScout({ isBuilder: false });
  }
}
