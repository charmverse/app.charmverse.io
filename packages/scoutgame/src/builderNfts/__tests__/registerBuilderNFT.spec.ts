import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { v4 } from 'uuid';

import { mockBuilder, mockScout, mockBuilderNft } from '../../testing/database';
import { randomLargeInt } from '../../testing/generators';
import { builderContractAddress, builderNftChain } from '../constants';

jest.unstable_mockModule('../contractClient', () => ({
  getBuilderContractAdminClient: () => ({
    getTokenIdForBuilder: () => Promise.resolve(randomLargeInt()),
    registerBuilderToken: jest.fn(),
    getTokenPurchasePrice: () => Promise.resolve(randomLargeInt())
  })
}));

jest.unstable_mockModule('../createBuilderNft', () => ({
  createBuilderNft: jest.fn()
}));

const { getBuilderContractAdminClient } = await import('../clients/builderContractWriteClient');

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
        contractAddress: builderContractAddress
      });
    });

    // Call the function
    await registerBuilderNFT({ builderId: builder.id, season: mockSeason });

    // Verify that a new NFT record was created in the database
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
    expect(createdNft?.chainId).toBe(builderNftChain.id);
    expect(createdNft?.contractAddress).toBe(builderContractAddress);
  });

  it('should return existing builder NFT if already registered', async () => {
    const builder = await mockBuilder();
    const existingNft = await mockBuilderNft({
      builderId: builder.id,
      season: mockSeason,
      chainId: builderNftChain.id,
      contractAddress: builderContractAddress
    });

    const result = await registerBuilderNFT({
      builderId: builder.id,
      season: mockSeason
    });

    expect(result?.id).toEqual(existingNft.id);
    expect(getBuilderContractAdminClient().registerBuilderToken).not.toHaveBeenCalled();
  });

  it('should throw an error if scout profile is not marked as a builder', async () => {
    const builder = await mockBuilder({ builderStatus: 'applied' });

    await expect(registerBuilderNFT({ builderId: builder.id, season: mockSeason })).rejects.toThrow(InvalidInputError);
  });
});
