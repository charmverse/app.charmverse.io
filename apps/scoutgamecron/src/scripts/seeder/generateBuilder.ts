import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { getBuilderContractAddress, builderNftChain } from '@packages/scoutgame/builderNfts/constants';
import { generateNftImage } from '@packages/scoutgame/builderNfts/artwork/generateNftImage';
import { currentSeason } from '@packages/scoutgame/dates';
import { randomString } from '@packages/utils/strings';

export async function generateBuilder({ index }: { index: number }) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const displayName = `${firstName} ${lastName}`;
  const path = faker.internet
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
  const avatar = `https://avatars.githubusercontent.com/u/${faker.number.int({ min: 1, max: 250000 })}`;
  const currentBuilderCount = index + 1;

  const githubUser = {
    id: faker.number.int({ min: 10000000, max: 25000000 }),
    login: path,
    email,
    displayName
  };
  const builderStatusRandom = faker.number.int({ min: 1, max: 10 });
  // 10% of builders are rejected, 10% of builders are applied, 80% of builders are approved
  const builderStatus = builderStatusRandom <= 1 ? 'applied' : builderStatusRandom <= 2 ? 'rejected' : 'approved';

  let builderNft: undefined | Prisma.BuilderNftCreateWithoutBuilderInput;
  if (builderStatus === 'approved') {
    const nftImageBuffer = await generateNftImage({
      avatar,
      displayName
    });

    // images will be hosted by the
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const scoutgamePublicFolder = join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'apps',
      'scoutgame',
      'public',
      'builder-nfts'
    );
    try {
      await fs.mkdir(scoutgamePublicFolder);
    } catch (e) {
      if ((e as any).code !== 'EEXIST') {
        console.error(e);
      }
    }
    await fs.writeFile(`${scoutgamePublicFolder}/${currentBuilderCount}.png`, new Uint8Array(nftImageBuffer));

    builderNft = {
      id: faker.string.uuid(),
      chainId: builderNftChain.id,
      contractAddress: getBuilderContractAddress(),
      currentPrice: faker.number.int({ min: 1000000, max: 10000000 }),
      season: currentSeason,
      tokenId: currentBuilderCount,
      imageUrl: `http://localhost:3000/builder-nfts/${currentBuilderCount}.png`
    };
  }
  if (builderNft) {
    await prisma.builderNft
      .delete({
        where: {
          contractAddress_tokenId_chainId: {
            contractAddress: builderNft.contractAddress,
            tokenId: builderNft.tokenId,
            chainId: builderNft.chainId
          }
        }
      })
      .catch((e) => null);
  }
  const builder = await prisma.scout.create({
    data: {
      path,
      displayName,
      email,
      avatar,
      bio: faker.lorem.paragraph(),
      agreedToTermsAt: new Date(),
      onboardedAt: new Date(),
      referralCode: randomString(),
      scoutWallet: {
        create: {
          address: faker.finance.ethereumAddress()
        }
      },
      farcasterId: faker.number.int({ min: 1, max: 5000000 }) + index,
      farcasterName: path,
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
