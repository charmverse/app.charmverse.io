import { InvalidInputError } from '@charmverse/core/errors';
import type { PointsReceipt, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { v4 as uuid } from 'uuid';

import { mockScout } from '../../testing/database';
import type { PointStats } from '../getPointStatsFromHistory';
import { getPointStatsFromHistory } from '../getPointStatsFromHistory';

describe('getPointStatsFromHistory', () => {
  let user: Scout;

  beforeAll(async () => {
    user = await mockScout({ path: uuid() });
  });

  it('should return point stats when valid UUID is provided', async () => {
    const stats = await getPointStatsFromHistory({ userIdOrPath: user.id });
    expect(stats).toMatchObject({
      userId: user.id,
      pointsSpent: expect.any(Number),
      pointsReceivedAsScout: expect.any(Number),
      pointsReceivedAsBuilder: expect.any(Number),
      bonusPointsReceived: expect.any(Number),
      claimedPoints: expect.any(Number),
      unclaimedPoints: expect.any(Number),
      balance: expect.any(Number)
    });
  });

  // @TODO: Redo the find by username logic
  it('should return point stats when valid username is provided', async () => {
    const stats = await getPointStatsFromHistory({ userIdOrPath: user.path! });
    expect(stats).toMatchObject({
      userId: user.id,
      pointsSpent: expect.any(Number),
      pointsReceivedAsScout: expect.any(Number),
      pointsReceivedAsBuilder: expect.any(Number),
      bonusPointsReceived: expect.any(Number),
      claimedPoints: expect.any(Number),
      unclaimedPoints: expect.any(Number),
      balance: expect.any(Number)
    });
  });

  it('should return detailed point stats, with a balance calculated based on points claimed minus claimed points (unclaimed points not in balance)', async () => {
    const pointsSpentRecords = [{ value: 100 }, { value: 50 }];

    const pointsSpent = 100 + 50;

    const pointsReceivedAsBuilderRecords = [
      { value: 80, claimedAt: new Date() },
      { value: 90, claimedAt: new Date() }
    ];

    const pointsReceivedAsScoutRecords = [{ value: 120 }, { value: 240, claimedAt: new Date() }];

    const bonusPointsReceivedRecords = [{ value: 40 }];

    const allPointsReceivedRecords = [
      ...pointsReceivedAsBuilderRecords,
      ...pointsReceivedAsScoutRecords,
      ...bonusPointsReceivedRecords
    ];

    const claimedPoints = allPointsReceivedRecords.reduce((acc, record) => {
      if ((record as Pick<PointsReceipt, 'claimedAt' | 'value'>).claimedAt) {
        return acc + record.value;
      }
      return acc;
    }, 0);

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(pointsSpentRecords as PointsReceipt[]);

    jest
      .spyOn(prisma.pointsReceipt, 'findMany')
      .mockResolvedValueOnce(pointsReceivedAsBuilderRecords as PointsReceipt[]);

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(pointsReceivedAsScoutRecords as PointsReceipt[]);

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(bonusPointsReceivedRecords as PointsReceipt[]);

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(allPointsReceivedRecords as PointsReceipt[]);

    const pointStats = await getPointStatsFromHistory({ userIdOrPath: user.id });

    // Sanity check that the points add up
    expect(pointStats.claimedPoints + pointStats.unclaimedPoints).toEqual(
      pointStats.pointsReceivedAsBuilder + pointStats.pointsReceivedAsScout + pointStats.bonusPointsReceived
    );

    expect(pointStats).toEqual<PointStats>({
      balance: claimedPoints - pointsSpent,
      bonusPointsReceived: 40,
      claimedPoints,
      pointsReceivedAsBuilder: 170,
      pointsReceivedAsScout: 360,
      pointsSpent: 150,
      unclaimedPoints: 160,
      userId: user.id
    });
  });

  it('should throw InvalidInputError when userIdOrUsername is empty', async () => {
    await expect(getPointStatsFromHistory({ userIdOrPath: '' })).rejects.toThrow(InvalidInputError);
  });

  it('should throw an error when userIdOrUsername is invalid UUID and does not exist as a username', async () => {
    const nonExistentUserId = uuid();
    await expect(getPointStatsFromHistory({ userIdOrPath: nonExistentUserId })).rejects.toThrow();
  });

  it('should throw an assertion error if point records for individual categories do not match the full list of point records', async () => {
    const pointsSpentRecords = [{ value: 100 }, { value: 50 }];
    const pointsReceivedAsBuilderRecords = [{ value: 80 }, { value: 90 }];
    const pointsReceivedAsScoutRecords = [{ value: 120 }];
    const bonusPointsReceivedRecords = [{ value: 40 }];
    const allPointsReceivedRecords = [
      ...pointsReceivedAsBuilderRecords,
      // Scout points are missing, so we expected an error
      // ...pointsReceivedAsScoutRecords,
      ...bonusPointsReceivedRecords
    ];

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(pointsSpentRecords as PointsReceipt[]); // Mismatch points
    //
    jest
      .spyOn(prisma.pointsReceipt, 'findMany')
      .mockResolvedValueOnce(pointsReceivedAsBuilderRecords as PointsReceipt[]); // Mismatch points

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(pointsReceivedAsScoutRecords as PointsReceipt[]); // Mismatch points

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(bonusPointsReceivedRecords as PointsReceipt[]); // Mismatch points

    jest.spyOn(prisma.pointsReceipt, 'findMany').mockResolvedValueOnce(allPointsReceivedRecords as PointsReceipt[]); // Mismatch points
    await expect(getPointStatsFromHistory({ userIdOrPath: user.id })).rejects.toThrow();
  });
});
