import { InvalidInputError } from '@charmverse/core/errors';

import type { MockBuilder } from '../../testing/database';
import { mockBuilder, mockBuilderNft, mockNFTPurchaseEvent, mockScout } from '../../testing/database';
import { dividePointsBetweenBuilderAndScouts } from '../dividePointsBetweenBuilderAndScouts';

describe('dividePointsBetweenBuilderAndScouts', () => {
  let builder: MockBuilder;
  let builderNft: Awaited<ReturnType<typeof mockBuilderNft>>;
  let starterPackNft: Awaited<ReturnType<typeof mockBuilderNft>>;

  let scout1: Awaited<ReturnType<typeof mockScout>>;
  let scout2: Awaited<ReturnType<typeof mockScout>>;

  const season = 'season-1';
  const rank = 1;
  const weeklyAllocatedPoints = 100_000;
  const normalisationFactor = 0.8;

  beforeAll(async () => {
    builder = await mockBuilder({ createNft: true });

    builderNft = await mockBuilderNft({ builderId: builder.id, season });
    starterPackNft = await mockBuilderNft({ builderId: builder.id, season, nftType: 'season_1_starter_pack' });

    scout1 = await mockScout();
    scout2 = await mockScout();

    await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: scout1.id,
      season,
      tokensPurchased: 10
    });

    await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: scout2.id,
      season,
      tokensPurchased: 20
    });

    await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: scout1.id,
      season,
      tokensPurchased: 10,
      nftType: 'season_1_starter_pack'
    });
  });

  // Success Cases
  it('should correctly distribute points among scouts and builder, counting normal NFTs as 10x compared to starter pack NFTs', async () => {
    const result = await dividePointsBetweenBuilderAndScouts({
      builderId: builder.id,
      season,
      rank,
      weeklyAllocatedPoints,
      normalisationFactor
    });

    expect(result).toMatchObject(
      expect.objectContaining({
        // 10 * 10 (normal NFT) + 10 * 20 (normal NFT) +  1 * 10 (starter pack NFT) = 310
        totalNftsPurchased: 310,
        nftsByScout: {
          [scout1.id]: 110,
          [scout2.id]: 200
        },
        earnableScoutPoints: 2400,
        pointsPerScout: expect.arrayContaining([
          expect.objectContaining({ scoutId: scout1.id, scoutPoints: 681 }),
          expect.objectContaining({ scoutId: scout2.id, scoutPoints: 1238 })
        ]),
        pointsForBuilder: 480
      })
    );

    const totalPointsDistributed = result.pointsPerScout.reduce((acc, scout) => acc + scout.scoutPoints, 0);
    expect(totalPointsDistributed + result.pointsForBuilder).toBeLessThanOrEqual(result.earnableScoutPoints);
  });

  // Error Cases
  it('should throw an error if builderId is invalid', async () => {
    await expect(
      dividePointsBetweenBuilderAndScouts({
        builderId: 'invalid-builder-id',
        season,
        rank,
        weeklyAllocatedPoints,
        normalisationFactor
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('should throw an error if rank is invalid', async () => {
    await expect(
      dividePointsBetweenBuilderAndScouts({
        builderId: builder.id,
        season,
        rank: -1,
        weeklyAllocatedPoints,
        normalisationFactor
      })
    ).rejects.toThrow('Invalid rank provided');
  });
});
