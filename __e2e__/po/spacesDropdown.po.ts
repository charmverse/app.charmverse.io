// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

// capture actions on the pages in signup flow
export class SpacesDropdown {
  readonly page: Page;

  readonly logoutButton: Locator;

  readonly spaceMenuBtn: Locator;

  readonly closeMemberPropertiesModalBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logoutButton = page.locator('data-test=logout-button');
    this.spaceMenuBtn = page.locator('data-test=sidebar-space-menu');
    this.closeMemberPropertiesModalBtn = page.locator('data-test=close-modal');
  }

  async signOut() {
    await this.spaceMenuBtn.click();
    await this.logoutButton.click();
  }
}
