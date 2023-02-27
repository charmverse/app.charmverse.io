// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

import { PageHeader } from './pageHeader.po';

// capture actions on the pages in signup flow
export class DocumentPage {
  readonly page: Page;

  header: PageHeader;

  archivedBanner: Locator;

  trashToggle: Locator;

  trashModal: Locator;

  deletePermanentlyButton: Locator;

  restoreArchivedButton: Locator;

  charmEditor: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new PageHeader(page);
    this.archivedBanner = this.page.locator('data-test=archived-page-banner');
    this.trashToggle = this.page.locator('data-test=sidebar--trash-toggle');
    this.deletePermanentlyButton = this.page.locator('data-test=banner--permanently-delete');
    this.restoreArchivedButton = this.page.locator('data-test=banner--restore-archived-page');
    this.trashModal = this.page.locator('data-test=trash-modal');
    this.charmEditor = this.page.locator('data-test=page-charmeditor').locator('div[contenteditable]').first();
  }

  async goToPage({ domain, path }: { domain: string; path: string }) {
    return this.page.goto(`${baseUrl}/${domain}/${path}`);
  }

  openTrash() {
    this.trashToggle.click();
  }

  getTrashItem(pageId: string) {
    return this.page.locator(`data-test=archived-page-${pageId}`);
  }

  async isPageEditable() {
    const isEditable = await this.charmEditor.getAttribute('contenteditable');
    return isEditable === 'true';
  }
}
