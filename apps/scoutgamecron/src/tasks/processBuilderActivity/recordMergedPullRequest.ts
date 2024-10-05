import { log } from '@charmverse/core/log';
import type {
  ActivityRecipientType,
  GemsReceiptType,
  GithubRepo,
  ScoutGameActivityType
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getBonusPartner } from '@packages/scoutgame/bonus';
import { getWeekFromDate, getWeekStartEnd, streakWindow, isToday, currentSeason } from '@packages/scoutgame/dates';
import { isTruthy } from '@packages/utils/types';
import { DateTime } from 'luxon';

import { gemsValues } from './config';
import type { PullRequest } from './getBuilderActivity';
import { getRecentPullRequestsByUser } from './getRecentPullRequestsByUser';

type RepoInput = Pick<GithubRepo, 'defaultBranch'>;

export type MergedPullRequestMeta = Pick<
  PullRequest,
  'author' | 'number' | 'title' | 'repository' | 'url' | 'createdAt' | 'mergedAt' | 'mergeCommit'
>;

/**
 *
 * @isFirstMergedPullRequest Only used for the seed data generator
 */
export async function recordMergedPullRequest({
  pullRequest,
  repo,
  season,
  isFirstMergedPullRequest: _isFirstMergedPullRequest,
  now = DateTime.utc()
}: {
  pullRequest: MergedPullRequestMeta;
  repo: RepoInput;
  isFirstMergedPullRequest?: boolean;
  season: string;
  now?: DateTime;
}) {
  if (!pullRequest.mergedAt) {
    throw new Error('Pull request was not merged');
  }
  const week = getWeekFromDate(now.toJSDate());
  const { start } = getWeekStartEnd(now.toJSDate());

  const previousGitEvents = await prisma.githubEvent.findMany({
    where: {
      createdBy: pullRequest.author.id,
      // streaks are based on created date
      createdAt: {
        gte: new Date(new Date(pullRequest.createdAt).getTime() - streakWindow)
      },
      type: 'merged_pull_request'
    },
    select: {
      id: true,
      createdAt: true,
      pullRequestNumber: true,
      repoId: true,
      createdBy: true,
      builderEvent: {
        select: {
          createdAt: true,
          week: true,
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

  const existingGithubEvent = previousGitEvents.some(
    (event) => event.pullRequestNumber === pullRequest.number && event.repoId === pullRequest.repository.id
  );

  if (existingGithubEvent) {
    // already processed
    return;
  }

  // check our data to see if this is the first merged PR, and if so, check the Github API to confirm
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

  const existingGithubEventToday = previousGitEvents.some((event) => {
    if (event.repoId !== pullRequest.repository.id) {
      return false;
    }
    return isToday(event.createdAt, DateTime.fromISO(pullRequest.createdAt, { zone: 'utc' }));
  });

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

    const event = await tx.githubEvent.create({
      data: {
        commitHash: pullRequest.mergeCommit?.oid,
        pullRequestNumber: pullRequest.number,
        title: pullRequest.title,
        type: 'merged_pull_request',
        createdBy: pullRequest.author.id,
        isFirstPullRequest: isFirstMergedPullRequest,
        repoId: pullRequest.repository.id,
        url: pullRequest.url,
        createdAt: pullRequest.createdAt,
        completedAt: pullRequest.mergedAt
      }
    });

    if (githubUser.builderId && !existingGithubEventToday) {
      const builder = await tx.scout.findUniqueOrThrow({
        where: {
          id: githubUser.builderId
        },
        select: {
          builderStatus: true
        }
      });

      if (builder.builderStatus !== 'approved') {
        return;
      }
      const weeklyBuilderEvents = previousGitEvents.filter((e) => e.builderEvent).length;
      const threeDayPrStreak = weeklyBuilderEvents % 3 === 2;
      const gemReceiptType: GemsReceiptType = isFirstMergedPullRequest
        ? 'first_pr'
        : threeDayPrStreak
        ? 'third_pr_in_streak'
        : 'regular_pr';

      // this is the date the PR was merged, which determines the season/week that it counts as a builder event
      const pullRequestDate = new Date(pullRequest.mergedAt!);
      const builderEventDate = pullRequestDate;
      const gemValue = gemsValues[gemReceiptType];

      if (builderEventDate >= start.toJSDate()) {
        const existingBuilderEvent = await tx.builderEvent.findFirst({
          where: {
            githubEventId: event.id
          },
          select: {
            id: true
          }
        });

        if (!existingBuilderEvent) {
          const activityType = (
            gemReceiptType === 'first_pr'
              ? 'gems_first_pr'
              : gemReceiptType === 'third_pr_in_streak'
              ? 'gems_third_pr_in_streak'
              : 'gems_regular_pr'
          ) as ScoutGameActivityType;

          // It's a new event, we can record notification
          const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
            where: {
              builderNFT: {
                season: currentSeason,
                builderId: githubUser.builderId
              }
            },
            select: {
              scoutId: true
            }
          });

          const uniqueScoutIds = Array.from(
            new Set(nftPurchaseEvents.map((nftPurchaseEvent) => nftPurchaseEvent.scoutId).filter(isTruthy))
          );

          await tx.builderEvent.create({
            data: {
              builderId: githubUser.builderId,
              createdAt: builderEventDate,
              season,
              week,
              type: 'merged_pull_request',
              githubEventId: event.id,
              bonusPartner: getBonusPartner(pullRequest.repository.nameWithOwner),
              gemsReceipt: {
                create: {
                  type: gemReceiptType,
                  value: gemValue,
                  createdAt: builderEventDate,
                  activities: {
                    createMany: {
                      data: [
                        ...uniqueScoutIds.map((scoutId) => ({
                          recipientType: 'scout' as ActivityRecipientType,
                          userId: scoutId,
                          type: activityType,
                          createdAt: builderEventDate
                        })),
                        {
                          recipientType: 'builder' as ActivityRecipientType,
                          userId: githubUser.builderId,
                          type: activityType,
                          createdAt: builderEventDate
                        }
                      ]
                    }
                  }
                }
              }
            }
          });
        }

        const thisWeekEvents = previousGitEvents.filter((e) => e.createdAt >= start.toJSDate());

        const gemsCollected = thisWeekEvents.reduce((acc, e) => {
          if (e.builderEvent?.gemsReceipt?.value && e.builderEvent.createdAt < builderEventDate) {
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
            season,
            gemsCollected
          },
          update: {
            gemsCollected
          }
        });
        log.info('Recorded a merged PR', {
          eventId: event.id,
          userId: githubUser.builderId,
          week,
          url: pullRequest.url,
          eventCount: thisWeekEvents.length + 1,
          gemsCollected
        });
      }
    }
  });
}
