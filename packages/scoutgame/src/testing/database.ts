import type { GithubRepo } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid, v4 } from 'uuid';

import { currentSeason } from '../utils';

import { randomLargeInt } from './generators';

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
      txHash: `0x${Math.random().toString(16).split('0.')}`,
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
      season: currentSeason,
      tokenId: Math.round(Math.random() * 10000000)
    }
  });
}
