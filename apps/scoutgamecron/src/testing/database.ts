import type { GithubRepo } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

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
