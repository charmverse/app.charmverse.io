import { prisma } from '@charmverse/core/prisma-client';
import { strikeBuilder } from '@packages/scoutgame/src/moderation/strikeBuilder';

import type { PullRequest } from './getPullRequests';

export async function processClosedPullRequests({
  pullRequests,
  githubUserId,
  repoId,
  week,
  builderId
}: {
  pullRequests: PullRequest[];
  githubUserId: number;
  repoId: string;
  week: string;
  builderId?: string;
}) {
  for (const pr of pullRequests) {
    await prisma.$transaction(async (tx) => {
      const githubEvent = await tx.githubEvent.create({
        data: {
          pullRequestNumber: pr.number,
          title: pr.title,
          type: 'merged_pull_request',
          createdBy: githubUserId,
          repoId
        }
      });

      if (builderId) {
        const builderEvent = await tx.builderEvent.create({
          data: {
            builderId,
            season: 1,
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
