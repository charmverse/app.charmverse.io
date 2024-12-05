import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder } from '@packages/scoutgame/testing/database';

import { currentSeason } from '../../dates';

jest.unstable_mockModule('../../builderNfts/builderRegistration/registerBuilderNFT', () => ({
  registerBuilderNFT: jest.fn()
}));

jest.unstable_mockModule('../../importReposByUser', () => ({
  importReposByUser: () => new Promise(() => {})
}));

const { approveBuilder } = await import('../approveBuilder');

const { registerBuilderNFT } = await import('../../builderNfts/builderRegistration/registerBuilderNFT');

describe('approveBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should approve a builder and register their NFT', async () => {
    const builder = await mockBuilder();

    await approveBuilder({ builderId: builder.id });

    // Check builder was approved
    const updatedBuilder = await prisma.scout.findUnique({
      where: { id: builder.id }
    });

    expect(updatedBuilder?.builderStatus).toBe('approved');

    // Check NFT was registered
    expect(registerBuilderNFT).toHaveBeenCalledWith(
      expect.objectContaining({
        builderId: builder.id,
        season: currentSeason
      })
    );
  });
});
