// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

// capture actions on the pages in signup flow
export class EditorPage {
  readonly page: Page;

  pageId: string = '';

  readonly documentTitle: Locator;

  constructor(page: Page) {
    this.page = page;

    this.documentTitle = page.locator('data-test=editor-page-title');
  }

  get editorContainer() {
    if (!this.pageId) {
      throw new Error('Page ID is not set');
    }

    return this.page.locator(`id=${this.pageId} >> div`).first();
  }

  async isEditable() {
    const contentEditable = await this.editorContainer.getAttribute('contenteditable');

    return contentEditable === 'true';
  }

  async goTo({ domain, pagePath }: { domain: string; pagePath: string }) {
    await this.page.goto(`${baseUrl}/${domain}/${pagePath}`);
  }

  async waitForUrl({ domain, pagePath }: { domain: string; pagePath: string }) {
    await this.page.waitForURL(`**/${baseUrl}/${domain}/${pagePath}`, { timeout: 0 });
  }
}
