import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';

import { mockBuilder, mockBuilderNft } from '../../testing/database';
import { randomLargeInt } from '../../testing/generators';
import { builderNftChain, getBuilderContractAddress } from '../constants';

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

jest.unstable_mockModule('../createBuilderNft', () => ({
  createBuilderNft: jest.fn()
}));

const { getBuilderContractMinterClient } = await import('../clients/builderContractMinterWriteClient');

const { registerBuilderNFT } = await import('../registerBuilderNFT');

const { createBuilderNft } = await import('../createBuilderNft');

describe('registerBuilderNFT', () => {
  const mockSeason = '1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new builder NFT record in the database', async () => {
    const builder = await mockBuilder();
    (createBuilderNft as jest.Mock<typeof createBuilderNft>).mockImplementation(async () => {
      return mockBuilderNft({
        builderId: builder.id,
        season: mockSeason,
        chainId: builderNftChain.id,
        contractAddress: getBuilderContractAddress()
      });
    });

    // Call the function
    await registerBuilderNFT({ builderId: builder.id, season: mockSeason });

    // Verify that a new NFT record was created in the database
    const createdNft = await prisma.builderNft.findFirst({
      where: {
        builderId: builder.id,
        chainId: builderNftChain.id,
        contractAddress: getBuilderContractAddress(),
        season: mockSeason
      }
    });

    expect(createdNft).not.toBeNull();
    expect(createdNft?.builderId).toBe(builder.id);
    expect(createdNft?.season).toBe(mockSeason);
    expect(createdNft?.chainId).toBe(builderNftChain.id);
    expect(createdNft?.contractAddress).toBe(getBuilderContractAddress());
  });

  it('should return existing builder NFT if already registered', async () => {
    const builder = await mockBuilder();
    const existingNft = await mockBuilderNft({
      builderId: builder.id,
      season: mockSeason,
      chainId: builderNftChain.id,
      contractAddress: getBuilderContractAddress()
    });

    const result = await registerBuilderNFT({
      builderId: builder.id,
      season: mockSeason
    });

    expect(result?.id).toEqual(existingNft.id);
    expect(getBuilderContractMinterClient().registerBuilderToken).not.toHaveBeenCalled();
  });

  it('should throw an error if scout profile is not marked as a builder', async () => {
    const builder = await mockBuilder({ builderStatus: 'applied' });

    await expect(registerBuilderNFT({ builderId: builder.id, season: mockSeason })).rejects.toThrow(InvalidInputError);
  });
});
