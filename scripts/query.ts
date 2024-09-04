import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';
import { uniqBy, uniq } from 'lodash';
/**
 * Use this script to perform database searches.
 */
import { getRepositoryActivity } from './github/getRepositoryActivity';
import { getGithubUsers } from './github/getGithubUsers';

const cutoffDate = new Date('2024-06-01');
async function query() {
  const repos = await prisma.cryptoEcosystemRepo.findMany({
    where: {
      pullRequestAuthorsCount: {
        gte: 5
      }
    },
    include: {
      pullRequests: true
    }
  });
  console.log('Retrieving PRs for', repos.length, 'repos');
  const needPrs = repos.filter((r) => r.pullRequests.length === 0);
  console.log('Still Retrieving PRs for', needPrs.length);

  const repoData = await getRepositoryActivity({
    cutoffDate: cutoffDate,
    repos: needPrs.map((r) => r.url)
  });
  const users = await prisma.cryptoEcosystemAuthor.findMany({});
  for (const repo of repoData) {
    const repoRecord = repos.find((r) => r.url === repo.url);
    if (!repoRecord) {
      console.error('Missing repo record', repo.url);
      continue;
    }
    // filter authors since we may not have users for bots
    const pullRequestsWithAuthor = repo.pullRequests.filter(
      (pr) => !!pr.node.author && users.some((u) => u.login === pr.node.author!.login)
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
      await prisma.cryptoEcosystemPullRequest.createMany({
        data: pullRequestsWithAuthor.map((pr) => ({
          githubId: pr.node.id,
          userGithubLogin: pr.node.author!.login,
          ecosystemTitle: repoRecord.ecosystemTitle,
          repoGithubId: repoRecord.githubId,
          date: new Date(pr.node.updatedAt),
          title: pr.node.title
        }))
      });
    } catch (error) {
      console.error('Error creating PRs', error);
      console.log(pullRequestsWithAuthor);
    }
    if (repoData.indexOf(repo) % 100 === 0) {
      console.log('updated', repoData.indexOf(repo));
    }
  }
  console.log('Done :D');
}

query();
