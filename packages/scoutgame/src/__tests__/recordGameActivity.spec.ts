// recordGameActivity.test.ts

import { prisma, ScoutGameActivityType, PointsDirection } from '@charmverse/core/prisma-client';

import { recordGameActivity } from '../recordGameActivity';
import { mockBuilder, mockBuilderStrike, mockNFTPurchaseEvent, ensureGithubUserExists } from '../testing/database';
import { randomLargeInt } from '../testing/generators';

describe('recordGameActivity', () => {
  beforeEach(async () => {
    // Reset the database before each test
    await prisma.scoutGameActivity.deleteMany({});
    await prisma.builderStrike.deleteMany({});
    await prisma.nFTPurchaseEvent.deleteMany({});
    await prisma.gemsPayoutEvent.deleteMany({});
    await prisma.pointsReceipt.deleteMany({});
    await prisma.builderNft.deleteMany({});
    await prisma.builderEvent.deleteMany({});
    await prisma.githubEvent.deleteMany({});
    await prisma.githubEvent.deleteMany({});
    await prisma.githubRepo.deleteMany({});
    await prisma.githubUser.deleteMany({});
    await prisma.scout.deleteMany({});
  });

  afterAll(async () => {
    // Close the Prisma client after all tests
    await prisma.$disconnect();
  });

  it('should throw an error if no source event is provided', async () => {
    await expect(
      recordGameActivity({
        activity: {
          userId: 'some-user-id',
          amount: 10,
          type: ScoutGameActivityType.strike,
          pointsDirection: PointsDirection.in
        },
        sourceEvent: {}
      })
    ).rejects.toThrow('At least one source event must be provided');
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
          type: ScoutGameActivityType.strike,
          pointsDirection: PointsDirection.in
        },
        sourceEvent: {
          builderStrikeId: builderStrike.id,
          nftPurchaseEventId: nftPurchaseEvent.id
        }
      })
    ).rejects.toThrow('Only one relation must be added');
  });

  it('should throw an error if onchainTxHash is provided without onchainChainId', async () => {
    await expect(
      recordGameActivity({
        activity: {
          userId: 'some-user-id',
          amount: 10,
          type: ScoutGameActivityType.mint,
          pointsDirection: PointsDirection.out
        },
        sourceEvent: {
          onchainTxHash: 'some-tx-hash'
        }
      })
    ).rejects.toThrow('onchainChainId is required when onchainTxHash is provided');
  });

  it('should throw an error if onchainChainId is provided without onchainTxHash', async () => {
    await expect(
      recordGameActivity({
        activity: {
          userId: 'some-user-id',
          amount: 10,
          type: ScoutGameActivityType.mint,
          pointsDirection: PointsDirection.out
        },
        sourceEvent: {
          onchainChainId: 1
        }
      })
    ).rejects.toThrow('onchainTxHash is required when onchainChainId is provided');
  });

  it('should throw an error if userId is not provided', async () => {
    await expect(
      recordGameActivity({
        activity: {
          userId: undefined as any,
          amount: 10,
          type: ScoutGameActivityType.mint,
          pointsDirection: PointsDirection.out
        },
        sourceEvent: {
          onchainTxHash: 'some-tx-hash',
          onchainChainId: 1
        }
      })
    ).rejects.toThrow('User id is required');
  });

  it('should throw an error if pointsDirection is invalid', async () => {
    await expect(
      recordGameActivity({
        activity: {
          userId: 'some-user-id',
          amount: 10,
          type: ScoutGameActivityType.mint,
          pointsDirection: 'invalid' as PointsDirection
        },
        sourceEvent: {
          onchainTxHash: 'some-tx-hash',
          onchainChainId: 1
        }
      })
    ).rejects.toThrow('Invalid pointsDirection: invalid');
  });

  it('should create a new activity when given valid inputs and chain data correctly', async () => {
    const builder = await mockBuilder();

    // Specify GitHub user ID for consistent data
    const githubUserId = randomLargeInt();
    await ensureGithubUserExists({ builderId: builder.id });

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
        type: ScoutGameActivityType.strike,
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
    const linkedStrike = await prisma.builderStrike.findUnique({
      where: { id: builderStrike.id },
      include: {
        githubEvent: true
      }
    });

    expect(linkedStrike!.githubEvent!.createdBy).toBe(githubUserId);
    expect(linkedStrike!.githubEvent!.pullRequestNumber).toBe(pullRequestNumber);
  });

  it('should return existing activity if already exists', async () => {
    const builder = await mockBuilder();
    const builderStrike = await mockBuilderStrike({ builderId: builder.id });

    // Create an activity
    const existingActivity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 10,
        type: ScoutGameActivityType.strike,
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
        type: ScoutGameActivityType.strike,
        pointsDirection: PointsDirection.in
      },
      sourceEvent: {
        builderStrikeId: builderStrike.id
      }
    });

    expect(activity.id).toBe(existingActivity.id);
  });

  it('should correctly determine activity type from source event', async () => {
    const builder = await mockBuilder();
    const builderStrike = await mockBuilderStrike({ builderId: builder.id });
    const nftPurchaseEvent = await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: builder.id
    });
    const gemsPayoutEvent = await prisma.gemsPayoutEvent.create({
      data: {
        builderId: builder.id,
        gems: 100,
        points: 1000,
        week: '2021-W01'
      }
    });
    const pointsReceipt = await prisma.pointsReceipt.create({
      data: {
        value: 50,
        eventId: 'some-event-id',
        recipientId: builder.id
      }
    });

    // Test for 'strike' type
    const strikeActivity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 10,
        type: ScoutGameActivityType.strike,
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
        type: ScoutGameActivityType.builder_registered,
        pointsDirection: PointsDirection.out
      },
      sourceEvent: {
        nftPurchaseEventId: nftPurchaseEvent.id
      }
    });
    expect(builderRegisteredActivity.type).toBe(ScoutGameActivityType.builder_registered);

    // Test for 'gems' type
    const gemsActivity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 30,
        type: ScoutGameActivityType.gems,
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
        type: ScoutGameActivityType.points,
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
        type: ScoutGameActivityType.mint,
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
        type: ScoutGameActivityType.strike,
        pointsDirection: PointsDirection.in
      },
      sourceEvent: {
        builderStrikeId: builderStrike.id
      }
    });

    // Mock the logger to capture the warning
    const logWarnMock = jest.spyOn(console, 'warn').mockImplementation();

    // Try to create the same activity again
    const activity = await recordGameActivity({
      activity: {
        userId: builder.id,
        amount: 10,
        type: ScoutGameActivityType.strike,
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
        type: ScoutGameActivityType.mint,
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
});
