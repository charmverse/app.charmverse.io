import { log } from '@charmverse/core/log';
import type { GemsReceiptType, GithubRepo } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getFormattedWeek, getWeekStartEnd, currentSeason, isSameDay } from '@packages/scoutgame/utils';

import type { PullRequest } from './getPullRequests';
import { getRecentPullRequestsByUser } from './getRecentPullRequestsByUser';

type RepoInput = Pick<GithubRepo, 'defaultBranch'>;

export async function processMergedPullRequest({
  pullRequest,
  repo,
  isFirstMergedPullRequest: _isFirstMergedPullRequest
}: {
  pullRequest: PullRequest;
  repo: RepoInput;
  isFirstMergedPullRequest?: boolean;
}) {
  const pullRequestDate = new Date(pullRequest.createdAt);
  const { start, end } = getWeekStartEnd(pullRequestDate);
  const week = getFormattedWeek(pullRequestDate);
  const thisWeeksEvents = await prisma.githubEvent.findMany({
    where: {
      createdBy: pullRequest.author.id,
      createdAt: {
        gte: start.toJSDate(),
        lte: end.toJSDate()
      },
      type: 'merged_pull_request'
    },
    select: {
      id: true,
      createdAt: true,
      repoId: true,
      createdBy: true,
      builderEvent: {
        select: {
          gemsReceipt: {
            select: {
              value: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const totalMergedPullRequests = await prisma.githubEvent.count({
    where: {
      createdBy: pullRequest.author.id,
      repoId: pullRequest.repository.id,
      type: 'merged_pull_request'
    }
  });

  let isFirstMergedPullRequest = _isFirstMergedPullRequest ?? totalMergedPullRequests === 0;
  if (isFirstMergedPullRequest) {
    // double-check using Github API in case the previous PR was not recorded by us
    const prs = await getRecentPullRequestsByUser({
      defaultBranch: repo.defaultBranch,
      repoNameWithOwner: pullRequest.repository.nameWithOwner,
      username: pullRequest.author.login
    });
    if (prs.filter((pr) => pr.number !== pullRequest.number).length > 0) {
      isFirstMergedPullRequest = false;
    }
  }

  const existingGithubEventToday = thisWeeksEvents.some((event) => {
    if (event.repoId !== pullRequest.repository.id) {
      return false;
    }

    return isSameDay(event.createdAt);
  });

  const weeklyBuilderEvents = thisWeeksEvents.filter((event) => event.builderEvent).length;

  await prisma.$transaction(async (tx) => {
    const githubUser = await tx.githubUser.upsert({
      where: {
        id: pullRequest.author.id
      },
      create: {
        id: pullRequest.author.id,
        login: pullRequest.author.login
      },
      update: {}
    });

    const existingGithubEvent = await tx.githubEvent.findFirst({
      where: {
        pullRequestNumber: pullRequest.number,
        createdBy: pullRequest.author.id,
        type: 'merged_pull_request',
        repoId: pullRequest.repository.id
      }
    });

    if (existingGithubEvent) {
      return;
    }

    const event = await tx.githubEvent.create({
      data: {
        pullRequestNumber: pullRequest.number,
        title: pullRequest.title,
        type: 'merged_pull_request',
        createdBy: pullRequest.author.id,
        isFirstPullRequest: isFirstMergedPullRequest,
        repoId: pullRequest.repository.id,
        url: pullRequest.url,
        createdAt: pullRequest.createdAt
      }
    });

    if (githubUser.builderId && !existingGithubEventToday) {
      const builder = await tx.scout.findUniqueOrThrow({
        where: {
          id: githubUser.builderId
        },
        select: {
          bannedAt: true,
          builder: true
        }
      });

      if (builder.bannedAt || !builder.builder) {
        return;
      }

      const threeDayPrStreak = weeklyBuilderEvents % 3 === 2;
      const gemReceiptType: GemsReceiptType = isFirstMergedPullRequest
        ? 'first_pr'
        : threeDayPrStreak
        ? 'third_pr_in_streak'
        : 'regular_pr';

      const gemValue = gemReceiptType === 'first_pr' ? 10 : gemReceiptType === 'third_pr_in_streak' ? 3 : 1;
      await tx.builderEvent.upsert({
        where: {
          githubEventId: event.id
        },
        create: {
          builderId: githubUser.builderId,
          season: currentSeason,
          week,
          type: 'merged_pull_request',
          githubEventId: event.id,
          createdAt: pullRequest.createdAt,
          gemsReceipt: {
            create: {
              type: gemReceiptType,
              value: gemValue,
              createdAt: pullRequest.createdAt
            }
          }
        },
        update: {}
      });
      const gemsCollected = thisWeeksEvents.reduce((acc, e) => {
        if (e.builderEvent?.gemsReceipt?.value) {
          return acc + e.builderEvent.gemsReceipt.value;
        }
        return acc;
      }, gemValue);
      await tx.userWeeklyStats.upsert({
        where: {
          userId_week: {
            userId: githubUser.builderId,
            week
          }
        },
        create: {
          userId: githubUser.builderId,
          week,
          gemsCollected
        },
        update: {
          gemsCollected
        }
      });
      log.info('Recorded a merged PR', { userId: githubUser.builderId, url: pullRequest.url, gemsCollected });
    }
  });
}
