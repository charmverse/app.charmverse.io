import type { Page } from '@playwright/test';

export class LoginPage {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private page: Page,
    public container = page.locator('data-test=login-page')
  ) {
    // silence is golden
  }
}
