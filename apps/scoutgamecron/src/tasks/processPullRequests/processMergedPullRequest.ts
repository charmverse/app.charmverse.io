import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFormattedWeek, getWeekStartEnd, timezone, currentSeason } from '@packages/scoutgame/utils';
import { DateTime } from 'luxon';

import type { PullRequest } from './getPullRequests';

export async function processMergedPullRequest(pullRequest: PullRequest) {
  const pullRequestDate = new Date(pullRequest.createdAt);
  const { start, end } = getWeekStartEnd(pullRequestDate);
  const week = getFormattedWeek(pullRequestDate);
  const thisWeeksEvents = await prisma.githubEvent.findMany({
    where: {
      createdBy: pullRequest.author.login,
      createdAt: {
        gte: start.toJSDate(),
        lte: end.toJSDate()
      }
    },
    include: {
      builderEvent: {
        include: {
          gemsReceipt: true
        }
      }
    }
  });
  const previousEventCount = await prisma.githubEvent.count({
    where: {
      createdBy: pullRequest.author.login
    }
  });
  // TODO: Also call Github API to find previous commits
  const isFirstCommit = previousEventCount === 0;
  const previousEventToday = thisWeeksEvents.some((event) => {
    if (event.repoId !== pullRequest.repository.id) {
      return false;
    }
    const eventDay = DateTime.fromJSDate(event.createdAt, { zone: timezone }).startOf('day');
    return eventDay.equals(DateTime.now().setZone(timezone).startOf('day'));
  });
  await prisma.$transaction(async (tx) => {
    const githubUser = await tx.githubUser.upsert({
      where: {
        login: pullRequest.author.login
      },
      create: {
        login: pullRequest.author.login
      },
      update: {}
    });
    const event = await tx.githubEvent.upsert({
      where: {
        unique_github_event: {
          pullRequestNumber: pullRequest.number,
          createdBy: pullRequest.author.login,
          type: 'merged_pull_request',
          repoId: pullRequest.repository.id
        }
      },
      create: {
        pullRequestNumber: pullRequest.number,
        title: pullRequest.title,
        type: 'merged_pull_request',
        createdBy: pullRequest.author.login,
        isFirstCommit,
        repoId: pullRequest.repository.id,
        url: pullRequest.url
      },
      update: {}
    });
    if (githubUser.builderId) {
      const builderType = isFirstCommit ? 'first_pr' : 'regular_pr';
      const gemValue = builderType === 'first_pr' ? 10 : 1;
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
          gemsReceipt: {
            create: {
              type: builderType,
              value: gemValue
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
