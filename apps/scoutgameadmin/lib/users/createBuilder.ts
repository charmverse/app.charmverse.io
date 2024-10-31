import { prisma } from '@charmverse/core/prisma-client';

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
}
