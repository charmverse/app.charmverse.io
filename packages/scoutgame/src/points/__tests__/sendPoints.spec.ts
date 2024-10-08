import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import { sendPoints } from '../sendPoints';

// Mock prisma
jest.mock('@charmverse/core/prisma-client', () => ({
  prisma: {
    $transaction: jest.fn()
  }
}));

describe('sendPoints', () => {
  const mockBuilderId = 'builder123';
  const mockPoints = 100;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send points correctly', async () => {
    // Mock $transaction
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'event1' }, // builderEvent.create
      { id: 'scout1' }, // scout.update
      { id: 'stats1' } // userSeasonStats.upsert (when earnedAsBuilder is true)
    ]);

    await sendPoints({
      builderId: mockBuilderId,
      points: mockPoints,
      earnedAsBuilder: true
    });

    // Add assertions here to check if $transaction was called with the correct parameters
    // Check if builderEvent.create, scout.update, and userSeasonStats.upsert were called correctly
  });

  // Add more test cases here:
  // - Test with different combinations of optional parameters (season, week, earnedAsBuilder, hideFromNotifications)
  // - Test when earnedAsBuilder is false
  // - Test error handling
});
