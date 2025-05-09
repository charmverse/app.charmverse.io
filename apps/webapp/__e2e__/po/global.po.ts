import type { Locator, Page } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';

export class GlobalPage {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    public page: Page,
    public dialog = page.locator('data-test=dialog'),
    public closeModal = page.locator('data-test=close-modal'),
    public openAsPageButton = page.locator('data-test=open-as-page'),
    public databasePage = page.locator('data-test=database-page'),
    public errorPage = page.locator('data-test=error-page')
  ) {
    // silence is golden
  }

  async goToHomePage(domain?: string) {
    await this.page.goto(`${baseUrl}${domain ? `/${domain}` : ''}`);
  }

  getSidebarLink(path: string) {
    return this.page.locator(`data-test=sidebar-link-${path}`);
  }

  async waitForDocumentPage({ domain, path }: { domain: string; path: string }) {
    await this.page.waitForURL(`${baseUrl}/${domain}/${path}`);
  }

  // url example: '**/api/proposals'
  async waitForJsonResponse<T>(url: string): Promise<T> {
    const response = await this.page.waitForResponse(url);
    return response.json();
  }
}
