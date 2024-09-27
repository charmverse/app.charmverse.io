import { getAllNftOwners } from '../builderNfts/getAllNftOwners';
import { mockBuilder, mockScout, mockBuilderNft } from '../testing/database';

describe('getAllNftOwners', () => {
  it('should return a list of unique scout IDs', async () => {
    // Mock data
    const builder = await mockBuilder();
    const scouts = await Promise.all([mockScout(), mockScout(), mockScout()]);

    const builderNft = await mockBuilderNft({ builderId: builder.id, owners: scouts });

    // Call the function
    const result = await getAllNftOwners({ builderId: builder.id, season: builderNft.season });

    // Assertions
    expect(result.sort()).toEqual(scouts.map((scout) => scout.id).sort());
    expect(result.length).toBe(3); // Ensure duplicates are removed
  });

  it('should return an empty array when no NFT exists', async () => {
    const builder = await mockBuilder();
    // Call the function
    const result = await getAllNftOwners({ builderId: builder.id, season: '1' });

    // Assertions
    expect(result).toEqual([]);
  });

  it('should return an empty array when no NFTs are sold', async () => {
    const builder = await mockBuilder();
    const builderNft = await mockBuilderNft({ builderId: builder.id });
    // Call the function
    const result = await getAllNftOwners({ builderId: builder.id, season: builderNft.season });

    // Assertions
    expect(result).toEqual([]);
  });
});
