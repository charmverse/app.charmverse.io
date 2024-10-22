import { log } from '@charmverse/core/log';
import type { ActivityRecipientType, GemsReceiptType, ScoutGameActivityType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/scoutgame/dates';
import { getWeekFromDate, getStartOfSeason, isToday } from '@packages/scoutgame/dates';
import { isTruthy } from '@packages/utils/types';
import { DateTime } from 'luxon';

import { gemsValues } from './config';
import type { Commit } from './github/getCommitsByUser';

export type RequiredCommitFields = Pick<Commit, 'sha' | 'html_url'> & {
  author: Pick<NonNullable<Commit['author']>, 'id' | 'login'> | null;
  commit: Pick<Commit['commit'], 'message'> & {
    author: Pick<Commit['commit']['author'], 'date'>;
    committer: Pick<NonNullable<Commit['commit']['committer']>, 'date'> | null;
  };
  repository: Pick<Commit['repository'], 'id' | 'name' | 'full_name'>;
};

export async function recordCommit({
  commit,
  season,
  now = DateTime.utc()
}: {
  commit: RequiredCommitFields;
  season: Season;
  now?: DateTime;
}) {
  if (!commit.author || !commit.commit.author) {
    log.warn('No commit author', commit);
    return null;
  }
  if (!commit.commit || !commit.commit.committer) {
    log.warn('No committer found', commit);
    return null;
  }

  const week = getWeekFromDate(now.toJSDate());
  const start = getStartOfSeason(season);

  const previousGitEvents = await prisma.githubEvent.findMany({
    where: {
      createdBy: commit.author.id
    },
    select: {
      id: true,
      commitHash: true,
      createdAt: true,
      repoId: true,
      createdBy: true,
      type: true,
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
    (event) => event.commitHash === commit.sha && event.type === 'commit'
  );

  if (existingGithubEvent) {
    // already processed
    return;
  }
  const existingPullRequestEvent = previousGitEvents.some(
    (event) => event.commitHash === commit.sha && event.type === 'merged_pull_request'
  );

  const existingGithubEventToday = previousGitEvents.some((event) => {
    return isToday(event.createdAt, DateTime.fromISO(commit.commit.author.date, { zone: 'utc' }));
  });

  await prisma.$transaction(async (tx) => {
    const githubUser = await tx.githubUser.upsert({
      where: {
        id: commit.author!.id
      },
      create: {
        id: commit.author!.id,
        login: commit.author!.login
      },
      update: {}
    });

    const event = await tx.githubEvent.create({
      data: {
        commitHash: commit.sha,
        title: commit.commit.message,
        type: 'commit',
        createdBy: commit.author!.id,
        repoId: commit.repository.id,
        url: commit.html_url,
        createdAt: commit.commit.author.date,
        completedAt: commit.commit.committer!.date
      }
    });

    if (githubUser.builderId && !existingGithubEventToday && !existingPullRequestEvent) {
      const gemReceiptType: GemsReceiptType = 'daily_commit';

      // this is the date the commit was merged, which determines the season/week that it counts as a builder event
      const builderEventDate = event.completedAt!;
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
          const activityType: ScoutGameActivityType = 'daily_commit';

          const repo = await prisma.githubRepo.findUniqueOrThrow({
            where: {
              id: commit.repository.id
            },
            select: {
              bonusPartner: true
            }
          });

          // It's a new event, we can record notification
          const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
            where: {
              builderNFT: {
                season,
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
              type: 'daily_commit',
              githubEventId: event.id,
              bonusPartner: repo.bonusPartner,
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

        log.info('Recorded a commit', {
          eventId: event.id,
          userId: githubUser.builderId,
          week,
          url: commit.html_url,
          sha: commit.sha
        });
      }
    }
  });
}
