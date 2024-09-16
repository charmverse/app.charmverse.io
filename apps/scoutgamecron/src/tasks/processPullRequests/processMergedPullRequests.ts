import type { GemsReceiptType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { checkIsBuilderBanned } from '@packages/scoutgame/src/checkIsBuilderBanned';

import type { PullRequest } from './getPullRequests';

const GemsReceiptValue = {
  first_pr: 10,
  third_pr_in_streak: 3,
  regular_pr: 1
};

export async function processMergedPullRequests({
  pullRequests,
  githubUserId,
  repoId,
  builderId,
  season,
  week
}: {
  season: number;
  week: string;
  pullRequests: PullRequest[];
  githubUserId: number;
  repoId: string;
  builderId?: string;
}) {
  for (const pullRequest of pullRequests) {
    await prisma.$transaction(async (tx) => {
      // Check if existing PR from this user was merged today
      const existingGithubEvent = await tx.githubEvent.findFirst({
        where: {
          createdBy: githubUserId,
          type: 'merged_pull_request',
          repoId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      });

      const githubEvent = await tx.githubEvent.create({
        data: {
          createdBy: githubUserId,
          type: 'merged_pull_request',
          pullRequestNumber: pullRequest.number,
          title: pullRequest.title,
          repoId
        }
      });

      if (builderId) {
        const builderEvent = await tx.builderEvent.create({
          data: {
            builderId,
            season,
            week,
            type: 'github_event',
            githubEventId: githubEvent.id
          }
        });
        const isBuilderBanned = await checkIsBuilderBanned(builderId);
        // Don't award gems for a PR that was already merged today
        if (!existingGithubEvent && !isBuilderBanned) {
          const mergedGithubEventsInRepo = await tx.githubEvent.count({
            where: {
              createdBy: githubUserId,
              type: 'merged_pull_request',
              repoId
            }
          });

          const mergedGithubEventsInWeek = await tx.githubEvent.count({
            where: {
              createdBy: githubUserId,
              type: 'merged_pull_request',
              repoId,
              builderEvent: {
                some: {
                  week,
                  season
                }
              }
            }
          });

          const type: GemsReceiptType = !mergedGithubEventsInRepo
            ? 'first_pr'
            : (mergedGithubEventsInWeek + 1) % 3 === 0
            ? 'third_pr_in_streak'
            : 'regular_pr';

          await tx.gemsReceipt.create({
            data: {
              type,
              value: GemsReceiptValue[type],
              eventId: builderEvent.id
            }
          });

          await tx.userWeeklyStats.upsert({
            where: {
              userId_week: {
                userId: builderId,
                week
              }
            },
            create: {
              gemsCollected: GemsReceiptValue[type],
              week,
              userId: builderId
            },
            update: {
              gemsCollected: {
                increment: GemsReceiptValue[type]
              }
            }
          });
        }
      }
    });
  }
}
