import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { currentSeason } from '@packages/scoutgame/dates';

export async function generateBuilder() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const displayName = `${firstName} ${lastName}`;
  const username = faker.internet
    .userName({
      firstName,
      lastName
    })
    .toLowerCase();
  const email = faker.datatype.boolean()
    ? faker.internet.email({
        firstName
      })
    : undefined;
  const avatar = faker.image.url();

  const githubUser = {
    id: faker.number.int({ min: 100000, max: 10000000 }),
    login: username,
    email,
    displayName
  };

  const currentBuilderCount = await prisma.scout.count({
    where: {
      builderStatus: 'approved'
    }
  });

  const builderNft = {
    id: faker.string.uuid(),
    chainId: 1,
    contractAddress: faker.finance.ethereumAddress(),
    currentPrice: faker.number.int({ min: 1, max: 100 }),
    season: currentSeason,
    tokenId: currentBuilderCount
  };

  const builderStatusRandom = faker.number.int({min: 1, max: 10});

  const builder = await prisma.scout.create({
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
      // 10% of builders are rejected
      // 10% of builders are applied
      // 80% of builders are approved
      builderStatus: builderStatusRandom <= 1 ? 'applied' : builderStatusRandom <= 2 ? 'rejected' : 'approved',
      githubUser: {
        create: githubUser
      },
      builderNfts: {
        create: builderNft
      }
    }
  });

  return {
    builder,
    githubUser,
    builderNft
  };
}
