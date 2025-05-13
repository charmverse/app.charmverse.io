import type { Locator, Page } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';

import { GlobalPage } from './global.po';
import { PageHeader } from './pageHeader.po';
import { PagePermissionsDialog } from './pagePermissions.po';

const charmEditorSelector = '.ProseMirror.bangle-editor';

// capture actions on the pages in signup flow
export class DocumentPage extends GlobalPage {
  public header: PageHeader;

  public archivedBanner: Locator;

  public commentsSidebar: Locator;

  public commentsSidebarEmptyMessage: Locator;

  public contextMenuButton: Locator;

  public contextMenuViewCommentsButton: Locator;

  public shareDialog: PagePermissionsDialog;

  public trashToggle: Locator;

  public deletePermanentlyButton: Locator;

  public restoreArchivedButton: Locator;

  public trashModal: Locator;

  public charmEditor: Locator;

  public proposalBanner: Locator;

  public documentTitle: Locator;

  public documentTitleInput: Locator;

  public openAsPageButton: Locator;

  public joinSpaceButton: Locator;

  public cardDetailProperties: Locator;

  public addCustomPropertyButton: Locator;

  public saveNewPage: Locator;

  public rootSelector: Pick<Locator, 'locator'>;

  public closeSidebar: Locator;

  public charmverseInlineCommentIcon: Locator;

  public charmverseInlineCommentThread: Locator;

  constructor(
    public page: Page,
    rootSelector?: string
  ) {
    super(page);
    this.rootSelector = rootSelector ? this.page.locator(rootSelector) : this.page;
    this.header = new PageHeader(page);
    this.archivedBanner = this.rootSelector.locator('data-test=archived-page-banner');
    this.commentsSidebar = this.rootSelector.locator('data-test=inline-comment-sidebar');
    this.commentsSidebarEmptyMessage = this.rootSelector.locator(
      'data-test=inline-comment-sidebar >> data-test=empty-message'
    );
    this.contextMenuButton = this.rootSelector.locator('data-test=page-context-menu-button');
    this.contextMenuViewCommentsButton = this.rootSelector.locator('data-test=view-comments-button');
    this.shareDialog = new PagePermissionsDialog(page);
    this.trashToggle = this.page.locator('data-test=sidebar--trash-toggle');
    this.deletePermanentlyButton = this.rootSelector.locator('data-test=banner--permanently-delete');
    this.restoreArchivedButton = this.rootSelector.locator('data-test=banner--restore-archived-page');
    this.trashModal = this.page.locator('data-test=trash-modal');
    this.charmEditor = this.rootSelector.locator('data-test=page-charmeditor >> .bangle-editor').first();
    this.proposalBanner = this.rootSelector.locator('data-test=proposal-banner');
    this.documentTitle = this.rootSelector.locator(`data-test=editor-page-title`);
    this.documentTitleInput = this.rootSelector.locator(`data-test=editor-page-title >> textarea`).first();
    this.openAsPageButton = this.rootSelector.locator('data-test=open-as-page');
    this.joinSpaceButton = this.rootSelector.locator('data-test=public-bounty-space-action');
    this.cardDetailProperties = this.rootSelector.locator('data-test=card-detail-properties');
    this.addCustomPropertyButton = this.rootSelector.locator('data-test=add-custom-property');
    this.saveNewPage = this.rootSelector.locator('data-test=save-new-page-button');
    this.closeSidebar = this.rootSelector.locator('data-test=close-sidebar-button');
    this.charmverseInlineCommentIcon = this.rootSelector.locator('data-test=charmverse-inline-comment-icon');
    this.charmverseInlineCommentThread = this.rootSelector.locator('data-test=inline-comment-thread');
  }

  async goToPage({ domain, path }: { domain: string; path: string }) {
    return this.page.goto(`${baseUrl}/${domain}/${path}`);
  }

  getLinkedPage(pageId: string) {
    return this.rootSelector.locator(`data-test=linked-page-${pageId}`);
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
    return this.rootSelector.locator(`data-test=comment-${commentId} >> div[contenteditable]`).first();
  }

  async isPageEditable() {
    const isEditable = await this.charmEditor.getAttribute('contenteditable');
    return isEditable === 'true';
  }

  async typeText(text: string) {
    await this.rootSelector.locator(charmEditorSelector).click();
    await this.rootSelector.locator(charmEditorSelector).type(text);
  }

  async getDocumentText() {
    const editorLocator = this.rootSelector.locator(charmEditorSelector);
    return editorLocator.textContent();
  }
}
