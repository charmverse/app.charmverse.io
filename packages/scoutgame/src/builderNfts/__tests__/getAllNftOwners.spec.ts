import { BuilderNftType } from '@charmverse/core/prisma-client';

import { mockBuilder, mockScout, mockNFTPurchaseEvent, mockBuilderNft } from '../../testing/database';
import { getAllNftOwners } from '../getAllNftOwners';

describe('getAllNftOwners', () => {
  it('should return a list of unique scout IDs', async () => {
    // Mock data
    const builder = await mockBuilder();
    const scouts = await Promise.all([mockScout(), mockScout(), mockScout()]);

    const builderNft = await mockBuilderNft({ builderId: builder.id, owners: scouts });

    // 2nd scout buys 2 nfts
    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scouts[0].id, season: builderNft.season });

    // Call the function
    const result = await getAllNftOwners({
      builderId: builder.id,
      season: builderNft.season,
      nftType: builderNft.nftType
    });

    // Assertions
    expect(result.sort()).toEqual(scouts.map((scout) => scout.id).sort());
    expect(result.length).toBe(3); // Ensure duplicates are removed
  });

  it('should return an empty array when no NFT exists', async () => {
    const builder = await mockBuilder();
    // Call the function
    const result = await getAllNftOwners({
      builderId: builder.id,
      season: '1',
      nftType: BuilderNftType.starter_pack
    });

    // Assertions
    expect(result).toEqual([]);
  });

  it('should return an empty array when no NFTs are sold', async () => {
    const builder = await mockBuilder();
    const builderNft = await mockBuilderNft({ builderId: builder.id });
    // Call the function
    const result = await getAllNftOwners({
      builderId: builder.id,
      season: builderNft.season,
      nftType: builderNft.nftType
    });

    // Assertions
    expect(result).toEqual([]);
  });
});
