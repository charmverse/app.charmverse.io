import fs from 'fs/promises';

import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { builderContractAddress, builderNftChain } from '@packages/scoutgame/builderNfts/constants';
import { generateNftImage } from '@packages/scoutgame/builderNfts/generateNftImage';
import { currentSeason } from '@packages/scoutgame/dates';

export async function generateBuilder({ index }: { index: number }) {
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
  const currentBuilderCount = index + 1;

  const githubUser = {
    id: faker.number.int({ min: 10000000, max: 25000000 }),
    login: username,
    email,
    displayName
  };
  const builderStatusRandom = faker.number.int({ min: 1, max: 10 });
  // 10% of builders are rejected, 10% of builders are applied, 80% of builders are approved
  const builderStatus = builderStatusRandom <= 1 ? 'applied' : builderStatusRandom <= 2 ? 'rejected' : 'approved';

  let builderNft: undefined | Prisma.BuilderNftCreateWithoutBuilderInput;
  if (builderStatus === 'approved') {
    const imageUrl = faker.datatype.boolean() ? avatar : faker.image.url();
    const nftImageBuffer = await generateNftImage({
      avatar: imageUrl,
      username
    });

    const scoutgamePublicFolder =
      '/Users/devorein/Documents/charmverse/app.charmverse.io/apps/scoutgame/public/builder-nfts';

    await fs.writeFile(`${scoutgamePublicFolder}/${currentBuilderCount}.png`, new Uint8Array(nftImageBuffer));

    builderNft = {
      id: faker.string.uuid(),
      chainId: builderNftChain.id,
      contractAddress: builderContractAddress,
      currentPrice: faker.number.int({ min: 1000000, max: 10000000 }),
      season: currentSeason,
      tokenId: currentBuilderCount,
      imageUrl: `http://localhost:3000/builder-nfts/${currentBuilderCount}.png`
    };
  }

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
      builderNfts:
        builderStatus === 'approved' && builderNft
          ? {
              create: builderNft
            }
          : undefined
    }
  });

  return {
    builder,
    githubUser,
    builderNft: builderStatus === 'approved' ? builderNft : undefined
  };
}
