import type { BuilderEvent, BuilderEventType, GithubRepo, Scout } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { getCurrentWeek } from '../dates';

import { randomLargeInt, mockSeason } from './generators';

type RepoAddress = {
  repoOwner?: string;
  repoName?: string;
};

export async function mockBuilder({
  createdAt,
  builderStatus = 'approved',
  githubUserId = randomLargeInt(),
  onboardedAt,
  username = uuid(),
  nftSeason = mockSeason,
  createNft = false
}: Partial<Scout & { githubUserId?: number; createNft?: boolean; nftSeason?: string }> = {}) {
  const result = await prisma.scout.create({
    data: {
      createdAt,
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

  if (createNft) {
    await mockBuilderNft({ builderId: result.id, season: nftSeason });
  }
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

export async function mockGemPayoutEvent({
  builderId,
  recipientId,
  amount = 10,
  week = getCurrentWeek()
}: {
  builderId: string;
  recipientId?: string;
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
          },
          pointsReceipts: {
            create: {
              value: amount,
              senderId: builderId,
              recipientId
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

export async function mockGithubUser({ builderId }: { builderId?: string }) {
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

export async function mockPullRequestBuilderEvent({
  repoOwner,
  repoName,
  pullRequestNumber = randomLargeInt(),
  season = mockSeason,
  builderId
}: {
  pullRequestNumber?: number;
  githubUserId: number;
  builderId: string;
  season?: string;
  id?: number;
} & RepoAddress): Promise<BuilderEvent> {
  const githubUser = await prisma.githubUser.findFirstOrThrow({ where: { builderId } });

  const repo = await mockRepo({ owner: repoOwner, name: repoName });

  const githubEvent = await prisma.githubEvent.create({
    data: {
      repoId: repo.id,
      pullRequestNumber,
      title: `Mock Pull Request ${pullRequestNumber}`,
      type: 'merged_pull_request',
      createdBy: githubUser.id,
      url: ``
    }
  });

  const builderEvent = await prisma.builderEvent.create({
    data: {
      builderId: builderId as string,
      season,
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
      name: fields.name ?? `test_repo_${+Math.random()}`,
      owner: fields.owner ?? `test_owner_${Math.random()}`,
      ownerType: fields.ownerType ?? 'org',
      defaultBranch: fields.defaultBranch ?? 'main'
    }
  });
}

export async function mockNFTPurchaseEvent({
  builderId,
  scoutId,
  points = 0,
  season = mockSeason,
  tokensPurchased = 1
}: {
  builderId: string;
  scoutId: string;
  points?: number;
  season?: string;
  tokensPurchased?: number;
}) {
  let builderNft = await prisma.builderNft.findFirst({
    where: {
      builderId
    }
  });

  if (!builderNft) {
    builderNft = await mockBuilderNft({ builderId });
  }

  return prisma.builderEvent.create({
    data: {
      builder: {
        connect: {
          id: builderId
        }
      },
      season,
      type: 'nft_purchase',
      week: getCurrentWeek(),
      nftPurchaseEvent: {
        create: {
          builderNftId: builderNft.id,
          scoutId,
          pointsValue: points,
          txHash: `0x${Math.random().toString(16).substring(2)}`,
          tokensPurchased
        }
      },
      pointsReceipts: {
        create: {
          value: points,
          recipientId: builderId,
          senderId: scoutId
        }
      }
    },
    include: { nftPurchaseEvent: true }
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
      imageUrl: 'https://placehold.co/600x400',
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
  const githubUser = await prisma.githubUser.findFirstOrThrow({ where: { builderId } });
  const githubBuilderEvent = await mockPullRequestBuilderEvent({
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

export function mockUserAllTimeStats({
  userId,
  pointsEarnedAsBuilder = Math.floor(Math.random() * 1000),
  pointsEarnedAsScout = Math.floor(Math.random() * 1000)
}: {
  userId: string;
  pointsEarnedAsBuilder?: number;
  pointsEarnedAsScout?: number;
}) {
  return prisma.userAllTimeStats.create({
    data: {
      userId,
      pointsEarnedAsBuilder,
      pointsEarnedAsScout
    }
  });
}

export function mockUserWeeklyStats({
  gemsCollected = Math.floor(Math.random() * 100),
  rank,
  userId,
  week = getCurrentWeek(),
  season = mockSeason
}: {
  gemsCollected?: number;
  rank?: number;
  userId: string;
  week?: string;
  season?: string;
}) {
  return prisma.userWeeklyStats.create({
    data: {
      userId,
      gemsCollected,
      rank,
      week,
      season
    }
  });
}
