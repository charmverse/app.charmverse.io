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
    }
  });
  console.log('Retrieving PRs for', repos.length);

  const repoData = await getRepositoryActivity({
    cutoffDate: cutoffDate,
    repos: repos.map((r) => r.url)
  });
  for (const repo of repoData) {
    const repoRecord = repos.find((r) => r.url === repo.url);
    if (!repoRecord) {
      console.error('Missing repo record', repo.url);
      continue;
    }
    await prisma.cryptoEcosystemPullRequest.createMany({
      data: repo.pullRequests
        .filter((pr) => !!pr.node.author)
        .map((pr) => ({
          githubId: pr.node.id,
          userGithubLogin: pr.node.author!.login,
          ecosystemTitle: repoRecord.ecosystemTitle,
          repoGithubId: repoRecord.githubId,
          date: new Date(pr.node.updatedAt),
          title: pr.node.title
        }))
    });
    if (repoData.indexOf(repo) % 100 === 0) {
      console.log('updated', repoData.indexOf(repo));
    }
  }
  console.log('Done :D');
}

query();
