import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

import { GlobalPage } from './global.po';

export class PagesSidebarPage extends GlobalPage {
  readonly pagesSidebar: Locator;

  readonly pagesSidebarAddPageButton: Locator;

  readonly pagesSidebarSelectAddDatabaseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pagesSidebar = page.locator('data-test=page-sidebar-header');
    this.pagesSidebarAddPageButton = this.pagesSidebar.locator('data-test=add-page');
    this.pagesSidebarSelectAddDatabaseButton = this.page.locator('data-test=menu-add-database');
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
}
