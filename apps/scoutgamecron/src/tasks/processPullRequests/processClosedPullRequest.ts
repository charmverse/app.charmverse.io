import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import type { PullRequest } from './getPullRequests';

export async function processClosedPullRequest(pullRequest: PullRequest) {
  const builder = await prisma.scout.findFirst({
    where: {
      githubUser: {
        some: {
          login: pullRequest.author.login
        }
      }
    },
    include: {
      strikes: true
    }
  });
  if (builder) {
    await prisma.githubEvent.create({
      data: {
        pullRequestNumber: pullRequest.number,
        title: pullRequest.title,
        type: 'closed_pull_request',
        createdBy: pullRequest.author.login,
        repoId: pullRequest.repository.id,
        strikes: {
          create: {
            builderId: builder.id
          }
        }
      }
    });
    const strikes = await prisma.builderStrike.count({
      where: {
        builderId: builder.id
      }
    });
    log.info('Marked closed PR', { userId: builder.id, strikes });
    if (strikes >= 3) {
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
