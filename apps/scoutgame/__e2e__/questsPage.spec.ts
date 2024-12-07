import { questsRecord } from '@packages/scoutgame/quests/questRecords';
import { mockScout } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Quests page', () => {
  test('Can claim', async ({ page, questsPage, utils }) => {
    const newUser = await mockScout({
      onboardedAt: new Date(),
      agreedToTermsAt: new Date()
    });
    await utils.loginAsUserId(newUser.id);

    await page.goto('/quests');
    await expect(questsPage.container).toBeVisible();

    // 6 days and 1 bonus should be disabled
    const disabledElements = await questsPage.dailyClaimDisabled.count();
    expect(disabledElements).toBe(7);

    // Just one quest should be enabled and can be clickable
    await expect(questsPage.dailyClaimEnabled).toBeVisible();
    const enabledElements = await questsPage.dailyClaimEnabled.count();
    expect(enabledElements).toBe(1);
    await questsPage.dailyClaimEnabled.click();
    await expect(questsPage.claimedIcon).toBeVisible();
  });

  test('Can click on quests', async ({ page, questsPage, utils }) => {
    const newUser = await mockScout({
      onboardedAt: new Date(),
      agreedToTermsAt: new Date()
    });
    await utils.loginAsUserId(newUser.id);

    await page.goto('/quests');
    await expect(questsPage.container).toBeVisible();

    // Get all quests except invite-friend which is separate
    const map = Object.keys(questsRecord)
      .filter((item) => item !== 'invite-friend')
      .map(async (key) => {
        const locator = page.locator(`data-test=quest-${key}`);
        await expect(locator).toBeVisible();
        await expect(locator).toBeEnabled();
        await locator.click();
      });

    await Promise.all(map);
  });

  test('Friendly quest', async ({ page, questsPage, utils, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const newUser = await mockScout({
      onboardedAt: new Date(),
      agreedToTermsAt: new Date()
    });
    await utils.loginAsUserId(newUser.id);

    await page.goto('/quests');
    await expect(questsPage.container).toBeVisible();

    await expect(questsPage.sidebar).toBeVisible();
    await expect(questsPage.friendlyQuest).toBeVisible();
    await expect(questsPage.friendlyQuest.getByText(newUser.referralCode)).toBeVisible();
    await expect(questsPage.copyReferralButton).toBeVisible();
    await questsPage.copyReferralButton.click();

    const handle = await page.evaluateHandle(() => navigator.clipboard.readText());
    const clipboardContent = await handle.jsonValue();
    expect(clipboardContent.includes(newUser.referralCode)).toBe(true);
  });
});
