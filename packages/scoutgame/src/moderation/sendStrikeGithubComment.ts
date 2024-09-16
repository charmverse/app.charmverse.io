import { prisma } from '@charmverse/core/prisma-client';

import { getStrikesForSeason } from './getStrikesForSeason';
import { octokit } from './octokitClient';

export async function sendStrikeGithubComment({ builderEventId }: { builderEventId: string }) {
  const builderEvent = await prisma.builderEvent.findFirstOrThrow({
    where: {
      id: builderEventId
    },
    select: {
      season: true,
      githubEvent: {
        select: {
          repo: {
            select: {
              owner: true,
              name: true
            }
          },
          pullRequestNumber: true
        }
      }
    }
  });

  if (!builderEvent.githubEvent) {
    throw new Error('No github event found');
  }

  const strikesForSeason = await getStrikesForSeason({ season: builderEvent.season });
  if (!strikesForSeason) {
    return;
  }

  const isBanned = strikesForSeason >= 3;
  const message = isBanned
    ? 'This builder has been banned from the scoutgame'
    : `This builder has been warned ${strikesForSeason} times`;
  await octokit.rest.issues.createComment({
    issue_number: builderEvent.githubEvent.pullRequestNumber,
    body: message,
    owner: builderEvent.githubEvent.repo.owner,
    repo: builderEvent.githubEvent.repo.name
  });
}
