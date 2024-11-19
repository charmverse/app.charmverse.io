import { log } from '@charmverse/core/log';
import type { ActivityRecipientType, GithubRepo, ScoutGameActivityType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/utils/types';
import { v4 as uuid } from 'uuid';

import { getClosedPullRequest } from './github/getClosedPullRequest';
import type { PullRequest } from './github/getPullRequestsByUser';

type RepoInput = Pick<GithubRepo, 'owner' | 'name'>;

export type ClosedPullRequestMeta = Pick<
  PullRequest,
  'author' | 'number' | 'title' | 'repository' | 'url' | 'createdAt' | 'closedAt'
>;

export async function recordClosedPullRequest({
  pullRequest,
  season,
  repo,
  prClosedBy,
  skipSendingComment
}: {
  pullRequest: ClosedPullRequestMeta;
  repo: RepoInput;
  season: string;
  prClosedBy?: string;
  skipSendingComment?: boolean;
}) {
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
      builderStatus: true,
      strikes: {
        select: {
          id: true
        }
      }
    }
  });
  if (builder) {
    // Check if this PR was closed by the author, then ignore it
    const { login: prClosingAuthorUsername } = prClosedBy
      ? { login: prClosedBy }
      : await getClosedPullRequest({
          pullRequestNumber: pullRequest.number,
          repo
        });

    const ignoreStrike = prClosingAuthorUsername === pullRequest.author.login;
    if (ignoreStrike) {
      log.debug('Ignore CLOSED PR since the author closed it', { url: pullRequest.url });
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
      return;
    }

    const strikesCount = await prisma.builderStrike.count({
      where: {
        builderId: builder.id,
        deletedAt: null
      }
    });
    const currentStrikesCount = strikesCount + 1;
    const shouldBeBanned = currentStrikesCount >= 3;
    const strikeId = uuid();

    const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
      where: {
        builderNFT: {
          season,
          builderId: builder.id
        }
      },
      select: {
        scoutId: true
      }
    });
    const uniqueScoutIds = Array.from(
      new Set(nftPurchaseEvents.map((nftPurchaseEvent) => nftPurchaseEvent.scoutId).filter(isTruthy))
    );

    const activityType = (shouldBeBanned ? 'builder_suspended' : 'builder_strike') as ScoutGameActivityType;

    await prisma.githubEvent.create({
      data: {
        pullRequestNumber: pullRequest.number,
        title: pullRequest.title,
        type: 'closed_pull_request',
        createdBy: pullRequest.author.id,
        repoId: pullRequest.repository.id,
        url: pullRequest.url,
        strike: ignoreStrike
          ? undefined
          : {
              create: {
                id: strikeId,
                builderId: builder.id,
                activities: {
                  createMany: {
                    data: [
                      ...uniqueScoutIds.map((scoutId) => ({
                        recipientType: 'scout' as ActivityRecipientType,
                        userId: scoutId,
                        type: activityType,
                        createdAt: pullRequest.closedAt
                      })),
                      {
                        recipientType: 'builder' as ActivityRecipientType,
                        userId: builder.id,
                        type: activityType,
                        createdAt: pullRequest.closedAt
                      }
                    ]
                  }
                }
              }
            },
        createdAt: pullRequest.createdAt,
        completedAt: pullRequest.closedAt
      }
    });

    if (ignoreStrike) {
      return;
    }

    log.info('Recorded a closed PR', { userId: builder.id, url: pullRequest.url, strikes: currentStrikesCount });

    if (shouldBeBanned && builder.builderStatus !== 'banned') {
      await prisma.scout.update({
        where: {
          id: builder.id
        },
        data: {
          builderStatus: 'banned'
        }
      });

      log.info('Banned builder', { userId: builder.id, strikes: currentStrikesCount });
    }
  }
}
