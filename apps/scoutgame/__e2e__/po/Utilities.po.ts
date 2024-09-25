import type { Page } from '@playwright/test';

export class Utilities {
  // eslint-disable-next-line no-useless-constructor
  constructor(private page: Page) {
    // silence is golden
  }

  async loginAsUserId(userId: string) {
    return this.page.request.get(`/api/login-dev?userId=${userId}`);
  }
}
