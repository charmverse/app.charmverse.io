import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { builderContractAddress, builderNftChain } from '../builderNfts/constants';
import { contractClient } from '../builderNfts/contractClient';
import { refreshBuilderNftPrice } from '../builderNfts/refreshBuilderNftPrice';
import { registerBuilderNFT } from '../builderNfts/registerBuilderNFT';
import { recordGameActivity } from '../recordGameActivity';
import { mockBuilder, mockBuilderNft } from '../testing/database';
import { mockSeason } from '../testing/generators';

jest.mock('../builderNfts/contractClient');
jest.mock('../builderNfts/refreshBuilderNftPrice');
jest.mock('../recordGameActivity');

describe('registerBuilderNFT', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a builder NFT record in the database', async () => {
    // Mock a builder
    const builder = await mockBuilder();

    // Mock contract client responses
    (contractClient.getTokenIdForBuilder as jest.Mock).mockResolvedValue(null);
    (contractClient.registerBuilderToken as jest.Mock).mockResolvedValue({});

    // Mock refreshBuilderNftPrice to return a new NFT
    const mockNft = await mockBuilderNft({ builderId: builder.id });
    (refreshBuilderNftPrice as jest.Mock).mockResolvedValue(mockNft);

    // Call the function
    const result = await registerBuilderNFT({ builderId: builder.id, season: mockSeason });

    // Assertions
    expect(result).toEqual(mockNft);

    // Verify that the NFT was created in the database
    const createdNft = await prisma.builderNft.findFirst({
      where: {
        builderId: builder.id,
        chainId: builderNftChain.id,
        contractAddress: builderContractAddress,
        season: mockSeason
      }
    });

    expect(createdNft).not.toBeNull();
    expect(createdNft?.builderId).toBe(builder.id);
    expect(createdNft?.season).toBe(mockSeason);

    // Verify that other necessary actions were called
    expect(contractClient.registerBuilderToken).toHaveBeenCalledWith({ args: { builderId: builder.id } });
    expect(recordGameActivity).toHaveBeenCalled();
    expect(prisma.scout.update).toHaveBeenCalledWith({
      where: { id: builder.id },
      data: { builderStatus: 'approved' }
    });
  });

  it('should return existing builder NFT if already registered', async () => {
    const builder = await mockBuilder();
    const existingNft = await mockBuilderNft({ builderId: builder.id, season: mockSeason });

    (refreshBuilderNftPrice as jest.Mock).mockResolvedValue(existingNft);

    const result = await registerBuilderNFT({ builderId: builder.id, season: mockSeason });

    expect(result).toEqual(existingNft);
    expect(contractClient.registerBuilderToken).not.toHaveBeenCalled();
  });

  it('should throw an error if builderId is not a valid UUID', async () => {
    await expect(registerBuilderNFT({ builderId: 'invalid-uuid', season: mockSeason })).rejects.toThrow(
      InvalidInputError
    );
  });

  it('should throw an error if scout profile does not have a github user', async () => {
    const builder = await mockBuilder({ githubUser: null, builderStatus: 'approved' });

    await expect(registerBuilderNFT({ builderId: builder.id, season: mockSeason })).rejects.toThrow(InvalidInputError);
  });

  it('should throw an error if scout profile is not marked as a builder', async () => {
    const builder = await mockBuilder({ githubUser: 'testuser', builderStatus: 'pending' });

    await expect(registerBuilderNFT({ builderId: builder.id, season: mockSeason })).rejects.toThrow(InvalidInputError);
  });
});
