import type { BuilderEvent, BuilderEventType, BuilderNftType, GithubRepo, Scout } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { randomString } from '@packages/utils/strings';
import { v4 as uuid } from 'uuid';

import { getCurrentWeek } from '../dates';

import { randomLargeInt, mockSeason } from './generators';

type RepoAddress = {
  repoOwner?: string;
  repoName?: string;
};

export async function mockBuilder({
  id,
  createdAt,
  displayName = 'Test User',
  builderStatus = 'approved',
  githubUserId = randomLargeInt(),
  githubUserLogin = `github_user:${githubUserId}`,
  onboardedAt,
  path = uuid(),
  agreedToTermsAt = new Date(),
  nftSeason = mockSeason,
  createNft = false,
  referralCode = randomString(),
  farcasterId,
  farcasterName
}: Partial<Scout & { githubUserId?: number; githubUserLogin?: string; createNft?: boolean; nftSeason?: string }> = {}) {
  const result = await prisma.scout.create({
    data: {
      createdAt,
      path,
      displayName,
      builderStatus,
      onboardedAt,
      agreedToTermsAt,
      farcasterId,
      referralCode,
      farcasterName,
      githubUsers: {
        create: {
          id: githubUserId,
          login: githubUserLogin
        }
      }
    },
    include: {
      githubUsers: true
    }
  });

  if (createNft) {
    await mockBuilderNft({ builderId: result.id, season: nftSeason });
  }
  const { githubUsers, ...scout } = result;
  return { ...scout, githubUser: githubUsers[0]! };
}

export type MockBuilder = Awaited<ReturnType<typeof mockBuilder>>;

export async function mockScout({
  createdAt,
  path = `user-${uuid()}`,
  displayName = 'Test Scout',
  agreedToTermsAt = new Date(),
  onboardedAt = new Date(),
  builderId,
  season,
  email,
  farcasterName,
  referralCode = randomString(),
  currentBalance,
  avatar
}: {
  createdAt?: Date;
  avatar?: string;
  path?: string;
  agreedToTermsAt?: Date | null;
  onboardedAt?: Date | null;
  displayName?: string;
  builderId?: string; // automatically "scout" a builder
  season?: string;
  email?: string;
  referralCode?: string;
  currentBalance?: number;
  farcasterName?: string;
} = {}) {
  const scout = await prisma.scout.create({
    data: {
      createdAt,
      path,
      agreedToTermsAt,
      onboardedAt,
      displayName,
      email,
      referralCode,
      currentBalance,
      avatar,
      farcasterName
    }
  });
  if (builderId) {
    await mockNFTPurchaseEvent({ builderId, scoutId: scout.id, season });
  }
  return scout;
}

export async function mockGemPayoutEvent({
  builderId,
  recipientId,
  amount = 10,
  week = getCurrentWeek(),
  season = mockSeason
}: {
  builderId: string;
  recipientId?: string;
  amount?: number;
  week?: string;
  season?: string;
}) {
  return prisma.gemsPayoutEvent.create({
    data: {
      gems: amount,
      points: 0,
      week,
      season,
      builder: {
        connect: {
          id: builderId
        }
      },
      builderEvent: {
        create: {
          season,
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

export async function mockBuilderEvent({
  builderId,
  eventType,
  week = getCurrentWeek(),
  createdAt = new Date()
}: {
  builderId: string;
  eventType: BuilderEventType;
  week?: string;
  createdAt?: Date;
}) {
  return prisma.builderEvent.create({
    data: {
      createdAt,
      builderId,
      season: mockSeason,
      type: eventType,
      week
    }
  });
}

export async function mockGithubUser({ builderId }: { builderId?: string } = {}) {
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
      name: fields.name ?? `test_repo_${Math.floor(Math.random() * 1000) + 1}`,
      owner: fields.owner ?? `test_owner_${Math.floor(Math.random() * 1000) + 1}`,
      ownerType: fields.ownerType ?? 'org',
      defaultBranch: fields.defaultBranch ?? 'main'
    }
  });
}

export async function mockNFTPurchaseEvent({
  builderId,
  scoutId,
  points = 0,
  week = getCurrentWeek(),
  season = mockSeason,
  tokensPurchased = 1,
  nftType
}: {
  builderId: string;
  scoutId: string;
  points?: number;
  season?: string;
  tokensPurchased?: number;
  week?: string;
  nftType?: BuilderNftType;
}) {
  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      builderId,
      season,
      nftType: nftType ?? 'default'
    }
  });

  return prisma.builderEvent.create({
    data: {
      builder: {
        connect: {
          id: builderId
        }
      },
      season,
      type: 'nft_purchase',
      week,
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
  tokenId = Math.round(Math.random() * 10000000),
  contractAddress = '0x1',
  owners = [],
  season = mockSeason,
  currentPrice = 100,
  nftType
}: {
  builderId: string;
  chainId?: number;
  contractAddress?: string;
  currentPrice?: number;
  owners?: (string | { id: string })[];
  season?: string;
  tokenId?: number;
  nftType?: BuilderNftType;
}) {
  const nft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId,
      contractAddress,
      currentPrice,
      season,
      imageUrl: 'https://placehold.co/600x400',
      tokenId,
      nftType: nftType ?? 'default',
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
  for (const owner of owners) {
    await mockNFTPurchaseEvent({
      builderId,
      season: nft.season,
      scoutId: typeof owner === 'string' ? owner : owner.id
    });
  }
  return nft;
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
