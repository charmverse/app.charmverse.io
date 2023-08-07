import type { Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';

import { LoginPage } from '../po/login.po';

type Fixtures = {
  sandboxPage: Page;
  loginPage: LoginPage;
};

const test = base.extend<Fixtures>({
  sandboxPage: async ({ browser: _browser }, use) => {
    const sandbox = await _browser.newContext();
    const page = await sandbox.newPage();
    await use(page);
  },
  loginPage: ({ sandboxPage }, use) => use(new LoginPage(sandboxPage))
});
test('login page layout', async ({ loginPage }, testInfo) => {
  testInfo.snapshotSuffix = '';

  await loginPage.goto();
  await loginPage.page.waitForLoadState('networkidle');
  await loginPage.waitForContent();
  await loginPage.page.waitForTimeout(500);

  await expect(loginPage.page).toHaveScreenshot();

  await loginPage.universalConnectButton.click();
  await loginPage.page.waitForLoadState('networkidle');
  await loginPage.page.waitForTimeout(500);

  await expect(loginPage.page).toHaveScreenshot();
});
