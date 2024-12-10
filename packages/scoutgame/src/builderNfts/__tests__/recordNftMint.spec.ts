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

jest.unstable_mockModule('@packages/mixpanel/trackUserAction', () => ({
  trackUserAction: jest.fn()
}));

jest.unstable_mockModule('@packages/scoutgame/builderNfts/refreshBuilderNftPrice', () => ({
  refreshBuilderNftPrice: jest.fn()
}));

const { recordNftMint } = await import('../recordNftMint');
const { trackUserAction } = await import('@packages/mixpanel/trackUserAction');
const { refreshBuilderNftPrice } = await import('@packages/scoutgame/builderNfts/refreshBuilderNftPrice');

describe('recordNftMint', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

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

    const builderEvent = await prisma.builderEvent.findFirstOrThrow({
      where: {
        nftPurchaseEvent: {
          builderNftId: builderNft.id
        }
      }
    });

    expect(builderEvent.type).toBe('nft_purchase');
    expect(builderEvent.builderId).toBe(builder.id);
    expect(builderEvent.season).toBe(builderNft.season);

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

    expect(trackUserAction).toHaveBeenCalledWith('nft_purchase', {
      userId: builderNft.builderId,
      amount,
      builderPath: builder.path,
      paidWithPoints: true,
      nftType: builderNft.nftType,
      season: builderNft.season
    });

    expect(refreshBuilderNftPrice).toHaveBeenCalledWith({
      builderId: builder.id,
      season: builderNft.season
    });
  });

  it('should skip mixpanel if this flag is provided', async () => {
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
      paidWithPoints: true,
      skipMixpanel: true
    });

    expect(trackUserAction).not.toHaveBeenCalled();
  });

  it('should skip price refresh if this flag is provided', async () => {
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
      paidWithPoints: true,
      skipPriceRefresh: true
    });

    expect(refreshBuilderNftPrice).not.toHaveBeenCalled();
  });
});
