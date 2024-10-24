import { currentSeason } from '@packages/scoutgame/dates';
import { mockGemPayoutEvent, mockScout } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Claim points', () => {
  test('Claim points and assert current balance', async ({ page, utils }) => {
    // add some mock data
    const newUser = await mockScout();

    await utils.loginAsUserId(newUser.id);

    await mockGemPayoutEvent({
      builderId: newUser.id,
      recipientId: newUser.id,
      amount: 10,
      season: currentSeason
    });

    await page.goto('/claim');

    await page.locator('[data-testid="claim-points-button"]').click();
    await page.locator('[data-testid="claim-points-success-modal"]').waitFor();
    const balance = await page.locator('[data-testid="user-points-balance"]').textContent();
    expect(balance).toEqual('10');
  });
});
