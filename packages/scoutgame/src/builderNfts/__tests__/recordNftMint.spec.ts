import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';

import { mockBuilder, mockScout, mockBuilderNft } from '../../testing/database';
import { randomLargeInt } from '../../testing/generators';

jest.unstable_mockModule('../clients/builderContractMinterWriteClient', () => ({
  getBuilderContractMinterClient: () => ({
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt())
  })
}));

jest.unstable_mockModule('../clients/builderContractReadClient', () => ({
  builderContractReadonlyApiClient: {
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt())
  }
}));

const { recordNftMint } = await import('../recordNftMint');

describe('recordNftMint', () => {
  it('should record a new NFT mint', async () => {
    const builder = await mockBuilder();
    const scout = await mockScout();
    const builderNft = await mockBuilderNft({ builderId: builder.id });

    const amount = 10;

    await recordNftMint({
      builderNftId: builderNft.id,
      amount,
      mintTxHash: `0x123${Math.random().toString()}`,
      pointsValue: 100,
      recipientAddress: scout.id,
      scoutId: scout.id,
      paidWithPoints: true
    });

    const builderStats = await prisma.userSeasonStats.findUniqueOrThrow({
      where: {
        userId_season: {
          userId: builder.id,
          season: builderNft.season
        }
      }
    });

    expect(builderStats?.nftsSold).toBe(amount);
    expect(builderStats?.nftOwners).toBe(1);

    const scoutStats = await prisma.userSeasonStats.findUniqueOrThrow({
      where: {
        userId_season: {
          userId: scout.id,
          season: builderNft.season
        }
      }
    });

    expect(scoutStats?.nftsPurchased).toBe(amount);
  });
});
