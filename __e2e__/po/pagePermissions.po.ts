import type { Locator, Page } from '@playwright/test';

export class PagePermissionsDialog {
  page: Page;

  permissionDialog: Locator;

  publicShareToggle: Locator;

  pageShareLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.permissionDialog = page.locator('data-test=toggle-page-permissions-dialog');
    this.publicShareToggle = page.locator('data-test=toggle-public-page');
    this.pageShareLink = page.locator('data-test=share-link').locator('input');
  }

  async togglePageIsPublic() {
    await this.publicShareToggle.click();
    await this.page.waitForResponse(/\/api\/permissions/);
  }

  async getPageShareLinkValue(): Promise<string | null> {
    const value = await this.pageShareLink.inputValue();
    return value;
  }
}
