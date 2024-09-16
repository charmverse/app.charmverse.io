import { prisma } from '@charmverse/core/prisma-client';
import { strikeBuilder } from '@packages/scoutgame/src/moderation/strikeBuilder';

import type { PullRequest } from './getPullRequests';

export async function processClosedPullRequests({
  pullRequests,
  githubUserId,
  repoId,
  week,
  builderId,
  season
}: {
  pullRequests: PullRequest[];
  githubUserId: number;
  repoId: string;
  week: string;
  builderId?: string;
  season: number;
}) {
  for (const pullRequest of pullRequests) {
    await prisma.$transaction(async (tx) => {
      const githubEvent = await tx.githubEvent.create({
        data: {
          pullRequestNumber: pullRequest.number,
          title: pullRequest.title,
          type: 'merged_pull_request',
          createdBy: githubUserId,
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
        await strikeBuilder({ builderId, builderEventId: builderEvent.id, tx });
      }
    });
  }
}
