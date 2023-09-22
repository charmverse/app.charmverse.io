import type { Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

import { GlobalPage } from './global.po';
import { PageHeader } from './pageHeader.po';
import { PagePermissionsDialog } from './pagePermissions.po';

// capture actions on the pages in signup flow
export class DocumentPage extends GlobalPage {
  constructor(
    public page: Page,
    public header = new PageHeader(page),
    public archivedBanner = page.locator('data-test=archived-page-banner'),
    public shareDialog = new PagePermissionsDialog(page),
    public trashToggle = page.locator('data-test=sidebar--trash-toggle'),
    public deletePermanentlyButton = page.locator('data-test=banner--permanently-delete'),
    public restoreArchivedButton = page.locator('data-test=banner--restore-archived-page'),
    public trashModal = page.locator('data-test=trash-modal'),
    public charmEditor = page.locator('data-test=page-charmeditor >> div[contenteditable]').first(),
    public proposalBanner = page.locator('data-test=proposal-banner'),
    public documentTitle = page.locator(`data-test=editor-page-title`),
    public openAsPageButton = page.locator('data-test=open-as-page'),
    public joinSpaceButton = page.locator('data-test=public-bounty-space-action'),
    public cardDetailProperties = page.locator('data-test=card-detail-properties')
  ) {
    super(page);
  }

  async goToPage({ domain, path }: { domain: string; path: string }) {
    return this.page.goto(`${baseUrl}/${domain}/${path}`);
  }

  getSelectProperties() {
    return this.cardDetailProperties.locator('data-test=closed-select-input').all();
  }

  openTrash() {
    this.trashToggle.click();
  }

  getTrashItem(pageId: string) {
    return this.page.locator(`data-test=archived-page-${pageId}`);
  }

  closeDialog() {
    return this.page.click('data-test=close-modal');
  }

  waitForDialog() {
    return this.page.waitForSelector('data-test=dialog');
  }

  getCardCommentContent(commentId: string) {
    return this.page.locator(`data-test=card-comment-content-${commentId} >> div[contenteditable]`).first();
  }

  async isPageEditable() {
    const isEditable = await this.charmEditor.getAttribute('contenteditable');
    return isEditable === 'true';
  }

  async typeText(text: string) {
    const charmEditorSelector = '.ProseMirror.bangle-editor';
    await this.page.click(charmEditorSelector);
    await this.page.type(charmEditorSelector, text);
  }
}
