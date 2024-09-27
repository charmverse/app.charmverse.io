import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { currentSeason } from '@packages/scoutgame/utils';

export async function generateScout(params: { isBuilder: boolean } = { isBuilder: false }) {
  const { isBuilder } = params;
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const displayName = `${firstName} ${lastName}`;
  const username = faker.internet.userName({
    firstName,
    lastName
  }).toLowerCase();
  const email = faker.datatype.boolean() ? faker.internet.email({
    firstName,
    
  }) : undefined;
  const avatar = faker.image.url();

  const githubUser = isBuilder
    ? {
        id: faker.number.int({ min: 100000, max: 10000000 }),
        login: username,
        email,
        displayName
      }
    : undefined;

  const currentBuilderCount = await prisma.scout.count({
    where: {
      builder: true
    }
  });

  const builderNft = isBuilder ? {
    id: faker.string.uuid(),
    chainId: 1,
    contractAddress: faker.finance.ethereumAddress(),
    currentPrice: faker.number.int({ min: 1, max: 100 }),
    season: currentSeason,
    tokenId: currentBuilderCount,
    imageUrl: faker.datatype.boolean() ? avatar : faker.image.avatar()
  } : undefined;

  const scout = await prisma.scout.create({
    data: {
      username,
      displayName,
      email,
      avatar,
      bio: faker.lorem.paragraph(),
      agreedToTermsAt: new Date(),
      onboardedAt: new Date(),
      walletAddress: faker.finance.ethereumAddress(),
      farcasterId: faker.number.int({ min: 1, max: 5000 }),
      farcasterName: displayName,
      builder: isBuilder,
      githubUser: isBuilder
        ? {
            create: githubUser
          }
        : undefined,
      builderNfts: isBuilder ? {
        create: builderNft
      } : undefined
    }
  });

  return {
    scout,
    githubUser,
    builderNft
  };
}
