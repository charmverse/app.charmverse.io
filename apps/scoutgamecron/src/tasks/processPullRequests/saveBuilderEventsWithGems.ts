import type {
  BuilderEvent,
  BuilderStrike,
  GithubEvent,
  GithubUser,
  Prisma,
  Scout
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

function deduplicateGithubEvents(githubEvents: (GithubEvent & { builderEvents: BuilderEvent[] })[]) {
  const eventMap = new Map<string, GithubEvent & { builderEvents: BuilderEvent[] }>();

  for (const event of githubEvents) {
    const eventDay = DateTime.fromJSDate(event.createdAt).startOf('day');
    const key = `${event.createdBy}-${event.type}-${eventDay.toISO()}-${event.repoId}`;

    if (!eventMap.has(key) || event.createdAt > eventMap.get(key)!.createdAt) {
      eventMap.set(key, event);
    }
  }

  return Array.from(eventMap.values());
}

function createGithubEventsPrismaArtifacts({
  season,
  week,
  githubEvents,
  strikes,
  githubUsers
}: {
  strikes: BuilderStrike[];
  githubEvents: (GithubEvent & { builderEvents: BuilderEvent[] })[];
  season: number;
  week: string;
  githubUsers: (GithubUser & { builder: Scout | null })[];
}) {
  const builderEventCreateManyInput: Prisma.BuilderEventCreateManyInput[] = [];
  const gemsReceiptCreateManyInput: Prisma.GemsReceiptCreateManyInput[] = [];
  const builderStrikeCreateManyInput: Prisma.BuilderStrikeCreateManyInput[] = [];
  const githubUsersBuilderIdRecord: Record<
    number,
    {
      id: string;
      banned: boolean;
    }
  > = {};
  const bannedBuilderIds: string[] = [];

  for (const githubUser of githubUsers) {
    if (githubUser.builder) {
      githubUsersBuilderIdRecord[githubUser.id] = {
        id: githubUser.builder.id,
        banned: !!githubUser.builder.bannedAt
      };
    }
  }

  const builderStrikesCount: Record<string, number> = {};
  for (const strike of strikes) {
    builderStrikesCount[strike.builderId] = (builderStrikesCount[strike.builderId] || 0) + 1;
  }

  const githubUserPullRequests: Record<number, { merged: GithubEvent[]; closed: GithubEvent[]; githubUserId: number }> =
    {};
  for (const githubEvent of githubEvents) {
    if (!githubUserPullRequests[githubEvent.createdBy]) {
      githubUserPullRequests[githubEvent.createdBy] = {
        merged: [],
        closed: [],
        githubUserId: githubEvent.createdBy
      };
    }

    // Store processed github events for the user
    if (githubEvent.builderEvents.length) {
      if (githubEvent.type === 'merged_pull_request') {
        githubUserPullRequests[githubEvent.createdBy].merged.push(githubEvent);
      } else if (githubEvent.type === 'closed_pull_request') {
        githubUserPullRequests[githubEvent.createdBy].closed.push(githubEvent);
      }
    }
  }

  for (const githubEvent of githubEvents) {
    const builderEvent = githubEvent.builderEvents[0];
    const builder = githubUsersBuilderIdRecord[githubEvent.createdBy];
    const isBuilderBanned = builder?.banned;
    // Only create a new builder event if it doesn't already exist
    // and if the builder exists in our system
    // and if the builder is not banned
    if (!builderEvent && builder && !isBuilderBanned) {
      const newBuilderEventId = v4();
      builderEventCreateManyInput.push({
        id: newBuilderEventId,
        builderId: builder.id,
        season,
        week,
        type: 'github_event',
        githubEventId: githubEvent.id
      });

      if (githubEvent.type === 'merged_pull_request') {
        const githubUserPullRequest = githubUserPullRequests[githubEvent.createdBy];
        const mergedPullRequestsOnRepo = githubUserPullRequest.merged.filter(
          (event) => event.repoId === githubEvent.repoId
        );
        // Check if the builder has a two days streak for merged pull requests
        const hasTwoDaysStreakOnRepo = mergedPullRequestsOnRepo.length % 3 === 2;

        gemsReceiptCreateManyInput.push({
          type: hasTwoDaysStreakOnRepo ? 'third_pr_in_streak' : 'regular_pr',
          value: hasTwoDaysStreakOnRepo ? 3 : 1,
          eventId: newBuilderEventId
        });
      } else if (githubEvent.type === 'closed_pull_request') {
        builderStrikeCreateManyInput.push({
          builderEventId: newBuilderEventId,
          builderId: builder.id
        });
        const builderCurrentStrikesCount = builderStrikesCount[builder.id] || 0;
        if (builderCurrentStrikesCount >= 3) {
          bannedBuilderIds.push(builder.id);
        }
      }
    }
  }

  return {
    builderEventCreateManyInput,
    gemsReceiptCreateManyInput,
    builderStrikeCreateManyInput,
    bannedBuilderIds
  };
}

export async function saveBuilderEventsWithGems({ season, week }: { season: number; week: string }) {
  const startOfWeek = DateTime.now().startOf('week');
  const endOfWeek = DateTime.now().endOf('week');
  const githubEvents = await prisma.githubEvent.findMany({
    where: {
      createdAt: {
        gte: startOfWeek.toJSDate(),
        lte: endOfWeek.toJSDate()
      }
    },
    include: {
      builderEvents: true
    }
  });

  const deduplicatedGithubEvents = deduplicateGithubEvents(githubEvents).sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  const strikes = await prisma.builderStrike.findMany({
    where: {
      builderEvent: {
        season
      },
      deletedAt: null
    }
  });

  const githubUsers = await prisma.githubUser.findMany({
    include: {
      builder: true
    }
  });

  const { builderEventCreateManyInput, gemsReceiptCreateManyInput, builderStrikeCreateManyInput, bannedBuilderIds } =
    createGithubEventsPrismaArtifacts({
      githubEvents: deduplicatedGithubEvents,
      strikes,
      season,
      week,
      githubUsers
    });

  await prisma.$transaction(async (tx) => {
    await tx.builderEvent.createMany({
      data: builderEventCreateManyInput
    });
    await tx.gemsReceipt.createMany({
      data: gemsReceiptCreateManyInput
    });
    await tx.builderStrike.createMany({
      data: builderStrikeCreateManyInput
    });
    await tx.scout.updateMany({
      where: {
        id: {
          in: bannedBuilderIds
        }
      },
      data: {
        bannedAt: new Date()
      }
    });
  });
}
