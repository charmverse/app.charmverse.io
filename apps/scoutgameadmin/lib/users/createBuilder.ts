import { prisma } from '@charmverse/core/prisma-client';
import { octokit } from '@packages/github/client';
import { approveBuilder } from '@packages/scoutgame/builders/approveBuilder';

export type CreateBuilderParams = {
  userId: string;
  githubLogin?: string;
};

export async function createBuilder(params: CreateBuilderParams) {
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: params.userId
    },
    include: {
      githubUser: true
    }
  });
  if (!scout.githubUser && !params.githubLogin) {
    throw new Error('Github login is required');
  }
  if (params.githubLogin) {
    const githubUser = await octokit.rest.users.getByUsername({ username: params.githubLogin });
    const githubUserDB = await prisma.githubUser.findUnique({
      where: {
        id: githubUser.data.id
      }
    });
    if (githubUserDB) {
      throw new Error('Github user already exists');
    }

    await prisma.githubUser.upsert({
      where: {
        id: githubUser.data.id
      },
      update: {
        builderId: scout.id
      },
      create: {
        id: githubUser.data.id,
        login: params.githubLogin,
        displayName: githubUser.data.name,
        email: githubUser.data.email,
        builderId: scout.id
      }
    });
  }
  await approveBuilder({ builderId: scout.id });
}
