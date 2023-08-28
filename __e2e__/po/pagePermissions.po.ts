import type { Locator, Page } from '@playwright/test';

export class PagePermissionsDialog {
  page: Page;

  permissionDialog: Locator;

  publicShareToggle: Locator;

  pageShareLink: Locator;

  publishTab: Locator;

  allowDiscoveryToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.permissionDialog = page.locator('data-test=toggle-page-permissions-dialog');
    this.publishTab = page.locator('data-test=Publish-tab');
    this.publicShareToggle = page.locator('data-test=toggle-public-page');
    this.allowDiscoveryToggle = page.locator('data-test=toggle-allow-page-discovery');
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
