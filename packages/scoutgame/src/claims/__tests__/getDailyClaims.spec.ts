import { getLastWeek } from '@packages/scoutgame/dates';
import { mockBuilder, mockBuilderEvent } from '@packages/scoutgame/testing/database';

import { claimDailyReward } from '../claimDailyReward';
import { getDailyClaims } from '../getDailyClaims';

describe('getDailyClaims', () => {
  it('should return the daily claims', async () => {
    const builder = await mockBuilder();
    const builder2 = await mockBuilder();
    const userId = builder.id;

    // Mock a daily commit event
    mockBuilderEvent({
      builderId: builder.id,
      eventType: 'daily_commit'
    });

    // Mock a daily claim event for last week
    mockBuilderEvent({
      builderId: builder.id,
      eventType: 'daily_claim',
      week: getLastWeek()
    });

    // Mock a daily claim event for a different builder
    mockBuilderEvent({
      builderId: builder2.id,
      eventType: 'daily_claim'
    });

    await claimDailyReward({
      userId,
      dayOfWeek: 1,
      isBonus: false
    });

    await claimDailyReward({
      userId,
      dayOfWeek: 7,
      isBonus: false
    });

    const claims = await getDailyClaims(userId);
    expect(claims).toHaveLength(8);
    const claimedEvents = claims.filter((claim) => claim.claimed);
    expect(claimedEvents.map((claim) => ({ day: claim.day, isBonus: claim.isBonus }))).toEqual([
      { day: 1, isBonus: false },
      { day: 7, isBonus: false }
    ]);
  });
});
