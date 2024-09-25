import type { BuilderEventType, GemsPayoutEvent, GithubRepo, Prisma, BuilderEvent } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { connect } from 'cookies';
import { v4 as uuid, v4 } from 'uuid';

import { currentSeason, getCurrentWeek } from '../utils';

import { randomLargeInt } from './generators';

type RepoAddress = {
  repoOwner?: string;
  repoName?: string;
};

export async function mockBuilder({
  bannedAt,
  githubUserId = randomLargeInt(),
  username = uuid()
}: {
  bannedAt?: Date;
  githubUserId?: number;
  username?: string;
} = {}) {
  const result = await prisma.scout.create({
    data: {
      username,
      displayName: 'Test User',
      bannedAt,
      builder: true,
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
      displayName,
      builder: false
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
export async function mockGemPayoutEvent({ builderId, amount = 10 }: { builderId: string; amount?: number }) {
  return prisma.gemsPayoutEvent.create({
    data: {
      gems: amount,
      points: 0,
      week: getCurrentWeek(),
      builder: {
        connect: {
          id: builderId
        }
      },
      builderEvent: {
        create: {
          season: currentSeason,
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
      season: currentSeason,
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
      builderEvent: true
    }
  });

  if (pullRequest?.builderEvent) {
    return pullRequest.builderEvent as BuilderEvent;
  }

  const githubEvent = await prisma.githubEvent.create({
    data: {
      repoId: repo.id,
      pullRequestNumber,
      title: `Mock Pull Request ${pullRequestNumber}`,
      type: 'merged_pull_request',
      createdBy: builderGithubUser.id,
      url: ``
    }
  });

  const builderEvent = await prisma.builderEvent.create({
    data: {
      builderId: builderGithubUser.builderId as string,
      season: currentSeason,
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
  contractAddress = '0x1'
}: {
  builderId: string;
  chainId?: number;
  contractAddress?: string;
}) {
  return prisma.builderNft.create({
    data: {
      builderId,
      chainId,
      contractAddress,
      currentPrice: 0,
      season: 0,
      tokenId: Math.round(Math.random() * 10000000)
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
