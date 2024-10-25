import { currentSeason } from '../../dates';
import { mockBuilder, mockGemPayoutEvent } from '../../testing/database';
import { claimPoints } from '../claimPoints';
import { getClaimablePoints } from '../getClaimablePoints';

describe('getClaimablePoints', () => {
  it('should get claimable points correctly', async () => {
    const builder = await mockBuilder({ currentBalance: 0 });
    await mockGemPayoutEvent({
      builderId: builder.id,
      recipientId: builder.id,
      amount: 10,
      season: currentSeason
    });
    const result = await getClaimablePoints({ userId: builder.id });
    expect(result.points).toEqual(10);
  });

  it('should skip points already claimed', async () => {
    const builder = await mockBuilder({ currentBalance: 0 });
    await mockGemPayoutEvent({
      builderId: builder.id,
      recipientId: builder.id,
      amount: 10,
      season: currentSeason
    });
    await claimPoints({ userId: builder.id });
    const result = await getClaimablePoints({ userId: builder.id });
    expect(result.points).toEqual(0);
  });
});
