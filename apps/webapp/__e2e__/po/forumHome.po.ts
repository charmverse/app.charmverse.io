// playwright-dev-page.ts
import type { PostCategory } from '@charmverse/core/prisma';
import type { Locator, Page } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';

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

  readonly postDialog: Locator;

  readonly postDialogCloseButton: Locator;

  readonly postDialogContextMenu: Locator;

  readonly postDialogDeleteButton: Locator;

  readonly categoryDescriptionInput: Locator;

  readonly saveCategoryDescription: Locator;

  readonly currentCategoryDescription: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addCategoryButton = page.locator('data-test=add-category-button');
    this.addCategoryInput = page.locator('data-test=add-category-input >> input');
    this.confirmNewCategoryButton = page.locator('data-test=confirm-new-category-button');
    this.sidebarForumLink = page.locator('data-test=sidebar-link-forum');
    this.categoryPermissionsDialog = page.locator('data-test=category-permissions-dialog');
    this.spaceCategoryPermissionSelect = page.locator('data-test=category-space-permission >> .MuiSelect-select');
    this.closeModalButton = page.locator('data-test=close-modal');
    this.postDialog = page.locator('data-test=dialog');
    this.postDialogCloseButton = page.locator('data-test=close-modal');
    this.postDialogContextMenu = page.locator('data-test=header--show-page-actions');
    this.postDialogDeleteButton = page.locator('data-test=header--delete-current-page');
    this.categoryDescriptionInput = page.locator('data-test=category-description-input').locator('textarea').first();
    this.saveCategoryDescription = page.locator('data-test=save-category-description');
    this.currentCategoryDescription = page.locator('data-test=current-category-description');
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

  async waitForCategory({ domain, path }: { domain: string; path: string }) {
    await this.page.waitForURL(`**/${domain}/forum/${path}`);
  }

  // Interact with post dialog ----------------
  getOpenPostAsPageLocator() {
    return this.page.locator('data-test=open-post-as-page');
  }

  async isDeletePostButtonDisabled(): Promise<boolean> {
    const button = this.postDialogDeleteButton;
    const classes = await button.getAttribute('class');
    return !!classes?.match('Mui-disabled');
  }

  // Interactions with categories sidebar ----------------
  getCategoryLocator(categoryId: string) {
    return this.page.locator(`data-test=forum-category-${categoryId}`);
  }

  getCategoryContextMenuLocator(categoryId: string) {
    return this.page.locator(`data-test=open-category-context-menu-${categoryId}`);
  }

  getCategoryEditDescriptionLocator(categoryId: string) {
    return this.page.locator(`data-test=open-category-description-dialog-${categoryId}`);
  }

  getCategoryManagePermissionsLocator(categoryId: string) {
    return this.page.locator(`data-test=open-category-permissions-dialog-${categoryId}`);
  }

  getPostVoteLocators(postId: string) {
    return {
      upvote: this.getPostCardLocator(postId).locator('data-test=upvote-post'),
      downvote: this.getPostCardLocator(postId).locator('data-test=upvote-post'),
      score: this.getPostCardLocator(postId).locator('data-test=post-score')
    };
  }

  async submitNewCategory(): Promise<PostCategory> {
    this.confirmNewCategoryButton.click();
    const response = await this.page.waitForResponse('**/api/spaces/*/post-categories');

    const parsedResponse = await response.json();

    if (response.status() >= 400) {
      throw parsedResponse;
    }

    return parsedResponse as PostCategory;
  }
}
