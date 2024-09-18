import { log } from '@charmverse/core/log';
import type { GithubRepo } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getClosedPullRequest } from './getClosedPullRequest';
import type { PullRequest } from './getPullRequests';

type RepoInput = Pick<GithubRepo, 'owner' | 'name' | 'defaultBranch'>;

export async function processClosedPullRequest(pullRequest: PullRequest, repo: RepoInput) {
  const builder = await prisma.scout.findFirst({
    where: {
      githubUser: {
        some: {
          id: pullRequest.author.id
        }
      }
    },
    select: {
      id: true,
      bannedAt: true,
      strikes: {
        select: {
          id: true
        }
      }
    }
  });

  if (builder) {
    let ignoreStrike = false;
    // Check if this PR was closed by the author, then ignore it
    const { login: prClosingAuthorUsername } = await getClosedPullRequest({
      pullRequestNumber: pullRequest.number,
      repo
    });
    if (prClosingAuthorUsername === pullRequest.author.login) {
      log.debug('Ignore CLOSED PR since the author closed it', { url: pullRequest.url });
      ignoreStrike = true;
    }

    const existingGithubEvent = await prisma.githubEvent.findFirst({
      where: {
        pullRequestNumber: pullRequest.number,
        createdBy: pullRequest.author.id,
        type: 'closed_pull_request',
        repoId: pullRequest.repository.id
      }
    });

    if (existingGithubEvent) {
      log.debug('Ignore CLOSED PR since it was already processed', { url: pullRequest.url });
    }

    await prisma.githubEvent.create({
      data: {
        pullRequestNumber: pullRequest.number,
        title: pullRequest.title,
        type: pullRequest.state === 'CLOSED' ? 'closed_pull_request' : 'merged_pull_request',
        createdBy: pullRequest.author.id,
        repoId: pullRequest.repository.id,
        url: pullRequest.url,
        strike: ignoreStrike
          ? undefined
          : {
              create: {
                builderId: builder.id
              }
            }
      }
    });

    const strikes = await prisma.builderStrike.count({
      where: {
        builderId: builder.id,
        deletedAt: null
      }
    });

    if (!ignoreStrike) {
      log.info('Recorded a closed PR', { userId: builder.id, url: pullRequest.url, strikes });
    }

    if (strikes >= 3 && !builder.bannedAt) {
      await prisma.scout.update({
        where: {
          id: builder.id
        },
        data: {
          bannedAt: new Date()
        }
      });
      log.info('Banned builder', { userId: builder.id, strikes });
    }
  }
}
