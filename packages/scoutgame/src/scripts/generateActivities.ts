import { log } from '@charmverse/core/log';
import { GithubEventType } from '@charmverse/core/prisma';
import { PointsDirection, prisma } from '@charmverse/core/prisma-client';

import type { BuilderEvent } from '@charmverse/core/prisma';
import { getBuilderContractAddress, builderNftChain } from '../builderNfts/constants';
import type { ActivityToRecord } from '../recordGameActivity';
import { recordGameActivity } from '../recordGameActivity';
import { refreshUserStats } from '../refreshUserStats';
import {
  mockBuilderStrike,
  mockPointReceipt,
  mockGemPayoutEvent,
  mockNFTPurchaseEvent,
  mockScout,
  mockGithubUser
} from '../testing/database';
import { randomLargeInt, mockSeason } from '../testing/generators';
import { getCurrentWeek, currentSeason } from '../dates';

type RepoAddress = {
  repoOwner?: string;
  repoName?: string;
};

type MockEventParams = {
  userId: string;
  amount?: number;
};

async function createMockEvents({ userId, amount = 5 }: MockEventParams) {
  const scout = await prisma.scout.findFirstOrThrow({
    where: {
      id: userId
    },
    include: {
      githubUser: true
    }
  });
  const week = new Date().getUTCDate();

  for (let i = 0; i < amount; i++) {
    // Frequent NFT Purchase events (occur in every loop)
    await mockNFTPurchaseEvent({
      builderId: userId,
      scoutId: userId,
      points: Math.floor(Math.random() * 100) + 1 // Random points between 1 and 100
    });

    // Rare Builder Strike events (10% chance of occurrence)
    if (Math.random() < 0.1) {
      await mockBuilderStrike({
        builderId: userId,
        pullRequestNumber: i + 1,
        repoOwner: 'test_owner',
        repoName: 'test_repo'
      });
    }

    // Point Receipt events
    await mockPointReceipt({
      builderId: userId,
      amount: Math.floor(Math.random() * 50) + 1, // Random points between 1 and 50
      senderId: scout.id,
      recipientId: undefined
    });

    // Gems Payout events
    await mockGemPayoutEvent({
      builderId: userId,
      week: `W-${week}-${i}`,
      amount: Math.floor(Math.random() * 10) + 1 // Random points between 1 and 10
    });
  }
}

async function ensureGithubRepoExists({
  repoOwner = `acme-${randomLargeInt()}`,
  repoName = `acme-repo-${randomLargeInt()}`,
  id
}: Partial<RepoAddress> & { id?: number }) {
  const repo = await prisma.githubRepo.findFirst({
    where: {
      owner: repoOwner,
      name: repoName
    }
  });

  if (repo) {
    return repo;
  }

  return prisma.githubRepo.create({
    data: {
      id: id ?? randomLargeInt(),
      owner: repoOwner,
      name: repoName,
      defaultBranch: 'main'
    }
  });
}

async function ensureGithubUserExists(
  { login, builderId }: { login?: string; builderId?: string } = { login: `github:${randomLargeInt()}` }
) {
  const githubUser = await prisma.githubUser.findFirst({ where: { login } });

  if (githubUser) {
    return githubUser;
  }

  const id = randomLargeInt();

  const name = `github_user:${id}`;
  return prisma.githubUser.create({
    data: {
      login: name,
      builderId,
      displayName: name,
      id
    }
  });
}

async function ensureMergedGithubPullRequestExists({
  repoOwner,
  repoName,
  pullRequestNumber = randomLargeInt(),
  githubUserId,
  builderId
}: {
  pullRequestNumber?: number;
  githubUserId: number;
  builderId?: string;
  id?: number;
} & RepoAddress): Promise<BuilderEvent> {
  builderId = builderId ?? (await mockScout().then((scout) => scout.id));

  const builderGithubUser = await mockGithubUser({ builderId });

  // Ensure the repository exists
  const repo = await ensureGithubRepoExists({ repoOwner, repoName });

  const pullRequest = await prisma.githubEvent.findFirst({
    where: {
      repoId: repo.id,
      pullRequestNumber,
      githubUser: {
        id: builderGithubUser.id
      },
      type: 'merged_pull_request'
    },
    select: {
      builderEvent: true,
      repoId: true
    }
  });

  if (pullRequest?.builderEvent) {
    return pullRequest.builderEvent as BuilderEvent;
  }

  const githubEvent = await prisma.githubEvent
    .findFirstOrThrow({
      where: {
        repoId: repo.id,
        pullRequestNumber,
        createdBy: githubUserId,
        type: GithubEventType.merged_pull_request
      }
    })
    .catch((err) => {
      return prisma.githubEvent.create({
        data: {
          repoId: repo.id,
          pullRequestNumber,
          title: `Mock Pull Request ${pullRequestNumber}`,
          type: 'merged_pull_request',
          createdBy: builderGithubUser.id,
          url: ``
        }
      });
    });

  const builderEvent = await prisma.builderEvent.create({
    data: {
      builderId: builderId as string,
      season: mockSeason,
      type: 'merged_pull_request',
      githubEventId: githubEvent.id,
      week: getCurrentWeek()
    }
  });

  return builderEvent;
}

function getRandomDateWithinLast30Days() {
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - 30);
  return new Date(pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime()));
}

export async function generateActivities({ userId }: { userId: string }) {
  const mints = await prisma.nFTPurchaseEvent.findMany({
    where: {
      scoutId: userId
    }
  });

  const builderStrikeEvents = await prisma.builderStrike.findMany({
    where: {
      builderId: userId
    }
  });

  const pointRecepts = await prisma.pointsReceipt.findMany({
    where: {
      OR: [
        {
          senderId: userId
        },
        {
          recipientId: userId
        }
      ]
    }
  });

  const gemPayouts = await prisma.gemsPayoutEvent.findMany({
    where: {
      builderId: userId
    }
  });

  const builderTokenEvents = await prisma.builderNft.findFirst({
    where: {
      chainId: builderNftChain.id,
      contractAddress: getBuilderContractAddress(),
      builderId: userId
    },
    include: {
      nftSoldEvents: {
        select: {
          scoutId: true
        }
      }
    }
  });

  const events: ActivityToRecord[] = [
    ...mints.map((event) => ({
      activity: {
        userId: event.scoutId,
        amount: event.tokensPurchased,
        pointsDirection: PointsDirection.in,
        createdAt: getRandomDateWithinLast30Days()
      },
      sourceEvent: {
        nftPurchaseEventId: event.id
      }
    })),
    ...builderStrikeEvents.map((event) => ({
      activity: {
        userId: event.builderId,
        amount: 0,
        pointsDirection: PointsDirection.in,
        createdAt: getRandomDateWithinLast30Days()
      },
      sourceEvent: {
        builderStrikeId: event.id
      }
    })),
    ...pointRecepts.flatMap((event) => {
      const _events: ActivityToRecord[] = [];

      if (event.senderId) {
        _events.push({
          activity: {
            userId: event.senderId,
            amount: event.value,
            pointsDirection: PointsDirection.out,
            createdAt: getRandomDateWithinLast30Days()
          },
          sourceEvent: {
            pointsReceiptId: event.id
          }
        });
      }

      if (event.recipientId) {
        _events.push({
          activity: {
            userId: event.recipientId,
            amount: event.value,
            pointsDirection: PointsDirection.in,
            createdAt: getRandomDateWithinLast30Days()
          },
          sourceEvent: {
            pointsReceiptId: event.id
          }
        });
      }

      return _events;
    }),
    ...gemPayouts.flatMap((event) => {
      const _events: ActivityToRecord[] = [];
      if (event.points) {
        _events.push({
          activity: {
            userId: event.builderId,
            amount: event.points,
            pointsDirection: PointsDirection.in,
            createdAt: getRandomDateWithinLast30Days()
          },
          sourceEvent: {
            gemsPayoutEventId: event.id
          }
        });
      }

      if (event.points) {
        _events.push({
          activity: {
            userId: event.builderId,
            amount: event.points,
            pointsDirection: PointsDirection.in,
            createdAt: getRandomDateWithinLast30Days()
          },
          sourceEvent: {
            gemsPayoutEventId: event.id
          }
        });
      }

      return _events;
    }),
    ...(builderTokenEvents?.nftSoldEvents.map((event) => ({
      activity: {
        userId: event.scoutId,
        amount: 0,
        pointsDirection: PointsDirection.in,
        createdAt: getRandomDateWithinLast30Days()
      },
      sourceEvent: {
        builderStrikeId: event.scoutId
      }
    })) || [])
  ];

  // Ensure no NFTs are sold until the BuilderToken is issued
  const builderTokenIssuedAt = builderTokenEvents ? getRandomDateWithinLast30Days() : null;
  if (builderTokenIssuedAt) {
    builderTokenEvents!.createdAt = builderTokenIssuedAt;
    events.push({
      activity: {
        userId: builderTokenEvents!.builderId,
        amount: 0,
        pointsDirection: PointsDirection.in,
        createdAt: builderTokenIssuedAt
      },
      sourceEvent: {
        builderStrikeId: builderTokenEvents!.id
      }
    });
  }

  // Sort events by createdAt
  events.sort((a, b) => a.activity.createdAt!.getTime() - b.activity.createdAt!.getTime());

  // Record activities
  for (const event of events) {
    await recordGameActivity(event).catch((error) => log.error(`Error recording activity`, { error }));
  }

  const stats = await prisma.userWeeklyStats.upsert({
    where: {
      userId_week: {
        userId,
        week: getCurrentWeek()
      }
    },
    create: {
      userId,
      season: currentSeason,
      week: getCurrentWeek(),
      gemsCollected: 30
    },
    update: {
      gemsCollected: 30
    }
  });
}

const githubLogin = 'motechFR';

async function script() {
  const githubAccount = await ensureGithubUserExists({
    login: githubLogin
  });

  let user = await prisma.scout.findFirst({
    where: {
      githubUser: {
        some: {
          login: githubLogin
        }
      }
    }
  });

  if (!user) {
    user = await prisma.scout.create({
      data: {
        displayName: githubAccount.login as string,
        username: githubAccount.login as string,
        builderStatus: 'approved',
        githubUser: {
          connect: {
            id: githubAccount.id
          }
        }
      }
    });
  }

  const userId = user.id;

  const current = await prisma.scoutGameActivity.count({
    where: {
      userId
    }
  });

  await createMockEvents({ userId, amount: 7 });

  await generateActivities({ userId });

  const newCount = await prisma.scoutGameActivity.count({
    where: {
      userId
    }
  });

  await refreshUserStats({ userId });

  log.info(`Created ${newCount - current}`);
}

script();
