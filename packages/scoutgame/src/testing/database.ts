import { GithubEventType } from '@charmverse/core/prisma';
import type { BuilderEvent, BuilderEventType, BuilderStatus, GithubRepo } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { getCurrentWeek } from '../dates';

import { randomLargeInt, mockSeason } from './generators';

type RepoAddress = {
  repoOwner?: string;
  repoName?: string;
};

export async function mockBuilder({
  builderStatus = 'approved',
  githubUserId = randomLargeInt(),
  onboardedAt,
  username = uuid()
}: {
  builderStatus?: BuilderStatus;
  githubUserId?: number;
  onboardedAt?: Date;
  username?: string;
} = {}) {
  const result = await prisma.scout.create({
    data: {
      username,
      displayName: 'Test User',
      builderStatus,
      onboardedAt,
      githubUser: {
        create: {
          id: githubUserId,
          login: username
        }
      }
    },
    include: {
      githubUser: true
    }
  });
  const { githubUser, ...scout } = result;
  return { ...scout, githubUser: githubUser[0]! };
}

export type MockBuilder = Awaited<ReturnType<typeof mockBuilder>>;

export async function mockScout({
  username = uuid(),
  displayName = 'Test Scout'
}: {
  username?: string;
  displayName?: string;
} = {}) {
  return prisma.scout.create({
    data: {
      username,
      displayName
    }
  });
}

export async function ensureGithubUserExists(
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
export async function mockGemPayoutEvent({
  builderId,
  amount = 10,
  week = getCurrentWeek()
}: {
  builderId: string;
  amount?: number;
  week?: string;
}) {
  return prisma.gemsPayoutEvent.create({
    data: {
      gems: amount,
      points: 0,
      week,
      season: mockSeason,
      builder: {
        connect: {
          id: builderId
        }
      },
      builderEvent: {
        create: {
          season: mockSeason,
          type: 'gems_payout',
          week: getCurrentWeek(),
          builder: {
            connect: {
              id: builderId
            }
          }
        }
      }
    }
  });
}

export async function mockBuilderEvent({ builderId, eventType }: { builderId: string; eventType: BuilderEventType }) {
  return prisma.builderEvent.create({
    data: {
      builderId,
      season: mockSeason,
      type: eventType,
      week: getCurrentWeek()
    }
  });
}

export async function mockPointReceipt({
  builderId,
  amount = 10,
  senderId,
  recipientId
}: {
  builderId: string;
  amount?: number;
  recipientId?: string;
  senderId?: string;
}) {
  const builderEvent = await mockBuilderEvent({ builderId, eventType: 'gems_payout' });

  return prisma.pointsReceipt.create({
    data: {
      value: amount,
      senderId,
      recipientId,
      eventId: builderEvent.id
    }
  });
}

export async function ensureGithubRepoExists({
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

export async function ensureMergedGithubPullRequestExists({
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

  const builderGithubUser = await ensureGithubUserExists({ builderId });

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

export function mockRepo(fields: Partial<GithubRepo> & { owner?: string } = {}) {
  return prisma.githubRepo.create({
    data: {
      ...fields,
      id: fields.id ?? randomLargeInt(),
      name: fields.name ?? 'test_repo',
      owner: fields.owner ?? 'test_owner',
      defaultBranch: fields.defaultBranch ?? 'main'
    }
  });
}

export async function mockNFTPurchaseEvent({
  builderId,
  scoutId,
  points
}: {
  builderId: string;
  scoutId: string;
  points?: number;
}) {
  let builderNft = await prisma.builderNft.findFirst({
    where: {
      builderId
    }
  });

  if (!builderNft) {
    builderNft = await mockBuilderNft({ builderId });
  }

  return prisma.nFTPurchaseEvent.create({
    data: {
      builderNftId: builderNft.id,
      scoutId,
      pointsValue: points ?? 0,
      txHash: `0x${Math.random().toString(16).substring(2)}`,
      tokensPurchased: 1
    }
  });
}

export async function mockBuilderNft({
  builderId,
  chainId = 1,
  contractAddress = '0x1',
  owners = [],
  season = mockSeason
}: {
  builderId: string;
  chainId?: number;
  contractAddress?: string;
  owners?: (string | { id: string })[];
  season?: string;
}) {
  return prisma.builderNft.create({
    data: {
      builderId,
      chainId,
      contractAddress,
      currentPrice: 0,
      season,
      tokenId: Math.round(Math.random() * 10000000),
      nftSoldEvents: {
        createMany: {
          data: owners.map((owner) => ({
            scoutId: typeof owner === 'string' ? owner : owner.id,
            pointsValue: 10,
            txHash: `0x${Math.random().toString(16).substring(2)}`,
            tokensPurchased: 1
          }))
        }
      }
    }
  });
}

export async function mockBuilderStrike({
  builderId,
  pullRequestNumber,
  repoOwner = 'test_owner',
  repoName = 'test_repo'
}: {
  builderId: string;
  pullRequestNumber?: number;
} & Partial<RepoAddress>) {
  builderId = builderId ?? (await mockScout().then((scout) => scout.id));

  const githubUser = await ensureGithubUserExists({ builderId });

  const githubBuilderEvent = await ensureMergedGithubPullRequestExists({
    githubUserId: githubUser.id,
    pullRequestNumber,
    repoName,
    repoOwner,
    builderId
  });

  return prisma.builderStrike.create({
    data: {
      builderId,
      githubEventId: githubBuilderEvent.githubEventId as string
    }
  });
}

interface MockEventParams {
  userId: string;
  amount?: number;
}

export async function createMockEvents({ userId, amount = 5 }: MockEventParams) {
  const scout = await prisma.scout.findFirstOrThrow({
    where: {
      id: userId
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
