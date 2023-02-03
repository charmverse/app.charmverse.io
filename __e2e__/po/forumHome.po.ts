// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

// capture actions on the pages in signup flow
export class ForumHomePage {
  readonly page: Page;

  readonly sidebarForumLink: Locator;

  readonly addCategoryButton: Locator;

  readonly addCategoryInput: Locator;

  readonly confirmNewCategoryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addCategoryButton = page.locator('data-test=add-category-button');
    this.addCategoryInput = page.locator('data-test=add-category-input >> input');
    this.confirmNewCategoryButton = page.locator('data-test=confirm-new-category-button');
    this.sidebarForumLink = page.locator('data-test=sidebar-link-forum');
  }

  async goToForumHome(domain: string) {
    await this.page.goto(`${baseUrl}/${domain}/forum`);
    await this.page.waitForURL(`**/${domain}/forum`);
  }

  getCategoryLocator(categoryId: string) {
    return this.page.locator(`data-test=forum-category-${categoryId}`);
  }

  getPostCardLocator(postId: string) {
    return this.page.locator(`data-test=forum-post-card-${postId}`);
  }

  getOpenPostAsPageLocator() {
    return this.page.locator('data-test=open-post-as-page');
  }

  async waitForCategory({ domain, path }: { domain: string; path: string }) {
    await this.page.waitForURL(`**/${domain}/forum/${path}`);
  }
}
