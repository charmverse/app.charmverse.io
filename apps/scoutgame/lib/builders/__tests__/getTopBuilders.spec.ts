import { prisma } from '@charmverse/core/prisma-client';
import {
  mockBuilder,
  mockScout,
  mockNFTPurchaseEvent,
  mockUserAllTimeStats,
  mockBuilderNft
} from '@packages/scoutgame/testing/database';
import { mockSeason } from '@packages/scoutgame/testing/generators';

import type { TopBuilderInfo } from '../getTopBuilders';
import { getTopBuilders } from '../getTopBuilders';

describe('getTopBuilders', () => {
  it('should correctly count unique scouts when a builder has sold multiple NFTs', async () => {
    const builder = await mockBuilder();
    const nft = await mockBuilderNft({ builderId: builder.id, currentPrice: 100, season: mockSeason });
    await prisma.userSeasonStats.create({
      data: {
        userId: builder.id,
        season: mockSeason,
        pointsEarnedAsScout: 0,
        pointsEarnedAsBuilder: 100
      }
    });

    // 2 scouts
    const scout = await mockScout({ builderId: builder.id });
    await mockScout({ builderId: builder.id });

    // 1 scout with 2 nft events
    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout.id, season: mockSeason });

    await mockUserAllTimeStats({
      userId: builder.id,
      pointsEarnedAsBuilder: 500
    });

    // Call the function
    const result = await getTopBuilders({ season: mockSeason });

    // Assertions
    expect(result).toHaveLength(1);
    const topBuilder = result[0] as TopBuilderInfo;
    expect(topBuilder.id).toBe(builder.id);
    expect(topBuilder.username).toBe(builder.username);
    expect(topBuilder.seasonPoints).toBe(100);
    expect(topBuilder.allTimePoints).toBe(500);
    expect(topBuilder.scoutedBy).toBe(2); // Should count unique scouts, not total sales
    expect(topBuilder.price).toBe(BigInt(100));
    expect(topBuilder.nftImageUrl).toBe(nft.imageUrl);
  });
});
