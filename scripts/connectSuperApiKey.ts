import { prisma } from '@charmverse/core/prisma-client';

async function enableSpaceAccess(spaceId: string, tokenName: string) {
  const token = await prisma.superApiToken.findUniqueOrThrow({
    where: {
      name: tokenName
    }
  });
  const space = await prisma.space.findUniqueOrThrow({ where: { id: spaceId } });
  if (space.superApiTokenId) {
    throw new Error('Space already has a super api key');
  }
  await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      superApiTokenId: token.id
    }
  });
  console.log('Enabling access to space:', spaceId);
  console.log('Token:', token);
}

enableSpaceAccess('345ee323-4f64-49e4-b46f-360ff7b1d84d', 'xps-engine');
