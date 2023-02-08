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

  readonly categoryPermissionsDialog: Locator;

  readonly spaceCategoryPermissionSelect: Locator;

  readonly closeModalButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addCategoryButton = page.locator('data-test=add-category-button');
    this.addCategoryInput = page.locator('data-test=add-category-input >> input');
    this.confirmNewCategoryButton = page.locator('data-test=confirm-new-category-button');
    this.sidebarForumLink = page.locator('data-test=sidebar-link-forum');
    this.categoryPermissionsDialog = page.locator('data-test=category-permissions-dialog');
    this.spaceCategoryPermissionSelect = page.locator('data-test=category-space-permission >> input');
    this.closeModalButton = page.locator('data-test=close-modal');
  }

  async goToForumHome(domain: string) {
    await this.page.goto(`${baseUrl}/${domain}/forum`);
    await this.waitForForumHome(domain);
  }

  async waitForForumHome(domain: string) {
    await this.page.waitForURL(`**/${domain}/forum`);
  }

  // Navigation across forum home page ----------------
  getPostCardLocator(postId: string) {
    return this.page.locator(`data-test=forum-post-card-${postId}`);
  }

  getOpenPostAsPageLocator() {
    return this.page.locator('data-test=open-post-as-page');
  }

  async waitForCategory({ domain, path }: { domain: string; path: string }) {
    await this.page.waitForURL(`**/${domain}/forum/${path}`);
  }

  // Interactions with categories sidebar ----------------
  getCategoryLocator(categoryId: string) {
    return this.page.locator(`data-test=forum-category-${categoryId}`);
  }

  getCategoryContextMenuLocator(categoryId: string) {
    return this.page.locator(`data-test=open-category-context-menu-${categoryId}`);
  }

  getCategoryManagePermissionsLocator(categoryId: string) {
    return this.page.locator(`data-test=open-category-permissions-dialog-${categoryId}`);
  }
}
