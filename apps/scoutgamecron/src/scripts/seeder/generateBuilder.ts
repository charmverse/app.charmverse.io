import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { builderContractAddress, builderNftChain } from '@packages/scoutgame/builderNfts/constants';
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
      builderStatus: {
        not: null
      }
    }
  });

  const builderNft = {
    id: faker.string.uuid(),
    chainId: builderNftChain.id,
    contractAddress: builderContractAddress,
    currentPrice: faker.number.int({ min: 10000, max: 100000 }),
    season: currentSeason,
    tokenId: currentBuilderCount,
    imageUrl: faker.datatype.boolean() ? avatar : faker.image.url()
  };

  const builderStatusRandom = faker.number.int({min: 1, max: 10});
  // 10% of builders are rejected, 10% of builders are applied, 80% of builders are approved
  const builderStatus = builderStatusRandom <= 1 ? 'applied' : builderStatusRandom <= 2 ? 'rejected' : 'approved';

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
      builderStatus,
      githubUser: {
        create: githubUser
      },
      builderNfts: builderStatus === "approved" ? {
        create: builderNft
      } : undefined
    }
  });

  return {
    builder,
    githubUser,
    builderNft: builderStatus === "approved" ? builderNft : undefined
  };
}
