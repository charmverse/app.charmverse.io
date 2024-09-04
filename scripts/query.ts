import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';
import { uniqBy, uniq } from 'lodash';
/**
 * Use this script to perform database searches.
 */
import { getRepositoryActivity } from './github/getRepositoryActivity';
import { getGithubUsers } from './github/getGithubUsers';
import { bots } from './github/query';
const cutoffDate = new Date('2024-06-01');

async function query() {
  const createdUserLogins: string[] = [];

  const _repos = await prisma.cryptoEcosystemRepo.findMany({
    where: {
      pullRequestAuthorsCount: {
        gte: 5
      }
    },
    include: {
      pullRequests: true
    }
  });

  const repos = _repos.filter((r) => r.pullRequests.length === 100);

  console.log('Retrieving PRs for', repos.length, 'repos');

  const repoData = await getRepositoryActivity({
    cutoffDate: cutoffDate,
    repos: repos.map((r) => r.url)
  });

  const users = await prisma.cryptoEcosystemAuthor.findMany({});
  for (const repo of repoData) {
    const repoRecord = repos.find((r) => r.url === repo.url);
    if (!repoRecord) {
      console.error('Missing repo record', repo.url);
      continue;
    }
    // filter authors since we may not have users for bots
    const newAuthors = uniq(
      repo.pullRequests
        .map((pr) => pr.node.author?.login)
        .filter(
          (login) =>
            login &&
            !users.some((u) => u.login === login) &&
            !createdUserLogins.includes(login) &&
            !bots.includes(login)
        )
    );
    const pullRequestsWithNoAuthor = repo.pullRequests.filter(
      (pr) => !!pr.node.author && !users.some((u) => u.login === pr.node.author!.login)
    );
    if (pullRequestsWithNoAuthor.length > 0) {
      console.log(
        'found prs with no author in the DB',
        repo.url,
        pullRequestsWithNoAuthor.map((pr) => pr.node.author.login)
      );
    }
    try {
      if (newAuthors.length > 0) {
        console.log('adding users', newAuthors);
        const users = await getGithubUsers({ logins: newAuthors });
        createdUserLogins.push(...newAuthors);
        for (let user of users) {
          await prisma.cryptoEcosystemAuthor.create({
            data: {
              login: user.login,
              email: user.email,
              xtra: {
                isHireable: user.isHireable,
                location: user.location
              },
              name: user.name,
              twitter: user.twitter
            }
          });
        }
      }
      const existingPullRequests = await prisma.cryptoEcosystemPullRequest.findMany({
        where: {
          githubId: {
            in: repo.pullRequests.map((p) => p.node.id)
          }
        }
      });
      const data = uniqBy(repo.pullRequests, (pr) => pr.node.id)
        .filter((pr) => pr.node.author)
        .filter((pr) => !bots.includes(pr.node.author!.login))
        .filter((pr) => !existingPullRequests.some((p) => p.githubId === pr.node.id))
        .map((pr) => ({
          githubId: pr.node.id,
          userGithubLogin: pr.node.author!.login,
          ecosystemTitle: repoRecord.ecosystemTitle,
          repoGithubId: repoRecord.githubId,
          date: new Date(pr.node.updatedAt),
          title: pr.node.title
        }));
      if (data.length > 0) {
        console.log('Creating extra PRs for', repo.url, data.length);
        await prisma.cryptoEcosystemPullRequest.createMany({
          data
        });
      }
    } catch (error) {
      console.error('Error creating PRs', error);
      // console.log(pullRequestsWithAuthor);
    }
    if (repoData.indexOf(repo) % 100 === 0) {
      console.log('updated', repoData.indexOf(repo));
    }
  }
  // const result = await prisma.cryptoEcosystemPullRequest.groupBy({
  //   by: ['repoGithubId'],
  //   having: {
  //     repoGithubId: {
  //       _count: {
  //         gt: 99
  //       }
  //     }
  //   }
  // });
  // console.log(result[0]);
  // console.log(result.length);
  console.log('Done :D');
}

query();
