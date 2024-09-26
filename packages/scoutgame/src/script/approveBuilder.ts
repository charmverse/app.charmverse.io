import { prisma } from '@charmverse/core/prisma-client';

export async function approveBuilder({ githubLogin, builderId }: { githubLogin: string; builderId: string }) {
  if (githubLogin && builderId) {
    throw new Error('Only provide githubLogin or builderId');
  }
  if (githubLogin && builderId) {
    throw new Error('githubLogin or builderId is required');
  }

  const builder = await prisma.scout.findFirstOrThrow({
    where: {
      id: builderId,
      githubUser: githubLogin
        ? {
            some: {
              login: githubLogin
            }
          }
        : undefined
    },
    include: {
      githubUser: true
    }
  });

  const githubUser = builder.githubUser[0];

  if (!githubUser) {
    throw new Error(`Builder ${builder.id} : ${builder.displayName} does not have a github user connected`);
  }

  const events = await prisma.githubEvent.findMany({
    where: {
      githubUser: {
        login: githubUser.login
      }
    }
  });

  /**
  minting + creating NFT

  marking scout.builder = true

  create builder events + gem receipts for existing github events

  update weekly stats 
   */
}
