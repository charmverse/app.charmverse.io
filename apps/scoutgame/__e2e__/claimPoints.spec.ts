import { currentSeason } from '@packages/scoutgame/dates';
import { mockGemPayoutEvent, mockScout, mockBuilder } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Claim points', () => {
  test('Claim points and assert current balance', async ({ page, claimPage, utils }) => {
    // add some mock data
    const builder = await mockBuilder({ createNft: true });
    const newUser = await mockScout({ builderId: builder.id });

    await utils.loginAsUserId(newUser.id);

    await mockGemPayoutEvent({
      builderId: newUser.id,
      recipientId: newUser.id,
      amount: 10,
      season: currentSeason
    });

    await page.goto('/claim');

    await claimPage.claimPointsButton.click();
    await expect(claimPage.successModal).toBeVisible();
    await expect(claimPage.headerPointsBalance.textContent()).toEqual('10');
  });
});
