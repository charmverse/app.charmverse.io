// recordGameActivity.test.ts

import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { PointsDirection, ScoutGameActivityType, prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';

import { recordGameActivity } from '../recordGameActivity';
import {
  mockPullRequestBuilderEvent,
  mockBuilder,
  mockBuilderStrike,
  mockGemPayoutEvent,
  mockNFTPurchaseEvent,
  mockPointReceipt,
  mockScout
} from '../testing/database';

describe('recordGameActivity', () => {
  it('should correctly determine activity type from source event', async () => {
    const builder = await mockBuilder();
    const builderStrike = await mockBuilderStrike({ builderId: builder.id });

    const prEvent = await mockPullRequestBuilderEvent({
      builderId: builder.id,
      githubUserId: builder.githubUser.id
    });

    const nftPurchaseEvent = await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: builder.id
    });
    const gemsPayoutEvent = await mockGemPayoutEvent({ builderId: builder.id });
    const pointsReceipt = await mockPointReceipt({ builderId: builder.id });

    // Test for 'strike' type
    const strikeActivity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 10,
        pointsDirection: PointsDirection.in
      },
      sourceEvent: {
        builderStrikeId: builderStrike.id
      }
    });
    expect(strikeActivity.type).toBe(ScoutGameActivityType.strike);

    // Test for 'builder_registered' type
    const builderRegisteredActivity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 20,
        pointsDirection: PointsDirection.out
      },
      sourceEvent: {
        nftPurchaseEventId: nftPurchaseEvent.id
      }
    });
    expect(builderRegisteredActivity.type).toBe(ScoutGameActivityType.mint);

    // Test for 'gems' type
    const gemsActivity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 30,
        pointsDirection: PointsDirection.in
      },
      sourceEvent: {
        gemsPayoutEventId: gemsPayoutEvent.id
      }
    });
    expect(gemsActivity.type).toBe(ScoutGameActivityType.gems);

    // Test for 'points' type
    const pointsActivity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 40,
        pointsDirection: PointsDirection.in
      },
      sourceEvent: {
        pointsReceiptId: pointsReceipt.id
      }
    });
    expect(pointsActivity.type).toBe(ScoutGameActivityType.points);

    // Test for 'mint' type (onchain event)
    const mintActivity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 50,
        pointsDirection: PointsDirection.out
      },
      sourceEvent: {
        onchainTxHash: 'some-tx-hash',
        onchainChainId: 1
      }
    });
    expect(mintActivity.type).toBe(ScoutGameActivityType.mint);
  });

  it('should log a warning and return existing activity when duplicate activity is recorded', async () => {
    const builder = await mockBuilder();
    const builderStrike = await mockBuilderStrike({ builderId: builder.id });

    // Create an activity
    const existingActivity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 10,
        pointsDirection: PointsDirection.in
      },
      sourceEvent: {
        builderStrikeId: builderStrike.id
      }
    });

    // Mock the logger to capture the warning
    const logWarnMock = jest.spyOn(log, 'warn');

    // Try to create the same activity again
    const activity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 10,
        pointsDirection: PointsDirection.in
      },
      sourceEvent: {
        builderStrikeId: builderStrike.id
      }
    });

    expect(activity.id).toBe(existingActivity.id);
    expect(logWarnMock).toHaveBeenCalledWith('Tried to log duplicate activity', {
      activity: expect.any(Object)
    });

    // Restore the console.warn mock
    logWarnMock.mockRestore();
  });

  it('should create an activity for an on-chain event when valid inputs are provided', async () => {
    const builder = await mockBuilder();

    const activity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 50,
        pointsDirection: PointsDirection.out
      },
      sourceEvent: {
        onchainTxHash: '0xabcdef1234567890',
        onchainChainId: 1
      }
    });

    expect(activity).toBeDefined();
    expect(activity.userId).toBe(builder.id);
    expect(activity.amount).toBe(50);
    expect(activity.type).toBe(ScoutGameActivityType.mint);
    expect(activity.pointsDirection).toBe(PointsDirection.out);
    expect(activity.onchainTxHash).toBe('0xabcdef1234567890');
    expect(activity.onchainChainId).toBe(1);
  });

  it('should throw an error if no source event is provided', async () => {
    const mockUser = await mockScout();

    await expect(
      recordGameActivity({
        activity: {
          userId: mockUser.id,
          amount: 10,
          pointsDirection: PointsDirection.in
        },
        sourceEvent: {}
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('should throw an error if more than one source event is provided without onchain event', async () => {
    const builder = await mockBuilder();
    const builderStrike = await mockBuilderStrike({ builderId: builder.id });
    const nftPurchaseEvent = await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: builder.id
    });

    await expect(
      recordGameActivity({
        activity: {
          userId: builder.id,
          amount: 10,
          pointsDirection: PointsDirection.in
        },
        sourceEvent: {
          builderStrikeId: builderStrike.id,
          nftPurchaseEventId: nftPurchaseEvent.id
        }
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('should throw an error if onchainTxHash is provided without onchainChainId', async () => {
    await expect(
      recordGameActivity({
        activity: {
          userId: 'some-user-id',
          amount: 10,
          pointsDirection: PointsDirection.out
        },
        sourceEvent: {
          onchainTxHash: 'some-tx-hash'
        }
      })
    ).rejects.toThrow('onchainChainId is required when onchainTxHash is provided');
  });

  it('should throw an error if onchainChainId is provided without onchainTxHash', async () => {
    const user = await mockBuilder();

    await expect(
      recordGameActivity({
        activity: {
          userId: user.id,
          amount: 10,
          pointsDirection: PointsDirection.out
        },
        sourceEvent: {
          onchainChainId: 1
        }
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('should throw an error if userId is not provided', async () => {
    await expect(
      recordGameActivity({
        activity: {
          userId: undefined as any,
          amount: 10,
          pointsDirection: PointsDirection.out
        },
        sourceEvent: {
          onchainTxHash: 'some-tx-hash',
          onchainChainId: 1
        }
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('should throw an error if pointsDirection is invalid', async () => {
    const user = await mockBuilder();
    await expect(
      recordGameActivity({
        activity: {
          userId: user.id,
          amount: 10,
          pointsDirection: 'invalid' as PointsDirection
        },
        sourceEvent: {
          onchainTxHash: 'some-tx-hash',
          onchainChainId: 1
        }
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('should create a new activity when given valid inputs and chain data correctly', async () => {
    const builder = await mockBuilder();

    // Create a builder strike with specific IDs
    const pullRequestNumber = 123;

    const builderStrike = await mockBuilderStrike({
      builderId: builder.id,
      pullRequestNumber
    });

    const activity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 10,
        pointsDirection: PointsDirection.in
      },
      sourceEvent: {
        builderStrikeId: builderStrike.id
      }
    });

    expect(activity).toBeDefined();
    expect(activity.userId).toBe(builder.id);
    expect(activity.amount).toBe(10);
    expect(activity.type).toBe(ScoutGameActivityType.strike);
    expect(activity.pointsDirection).toBe(PointsDirection.in);
    expect(activity.builderStrikeId).toBe(builderStrike.id);

    // Verify that the activity is linked to the correct GitHub user and pull request
    const linkedStrike = await prisma.builderStrike.findUniqueOrThrow({
      where: { id: builderStrike.id },
      include: {
        githubEvent: true
      }
    });

    expect(linkedStrike.githubEvent!.createdBy).toBe(builder.githubUser.id);
    expect(linkedStrike.githubEvent!.pullRequestNumber).toBe(pullRequestNumber);
  });

  it('should return existing activity if already exists', async () => {
    const builder = await mockBuilder();
    const builderStrike = await mockBuilderStrike({ builderId: builder.id });

    // Create an activity
    const existingActivity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 10,
        pointsDirection: PointsDirection.in
      },
      sourceEvent: {
        builderStrikeId: builderStrike.id
      }
    });

    // Try to create the same activity again
    const activity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 10,
        pointsDirection: PointsDirection.in
      },
      sourceEvent: {
        builderStrikeId: builderStrike.id
      }
    });

    expect(activity.id).toBe(existingActivity.id);
  });
});
