// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { GlobalPage } from './global.po';

// capture actions on the pages in signup flow
export class BountyPage extends GlobalPage {
  readonly bountyPropertiesConfiguration: Locator;

  // Editable amount field
  readonly bountyPropertyAmount: Locator;

  // Readonly amount field
  readonly bountyHeaderAmount: Locator;

  readonly bountyApplicantForm: Locator;

  readonly bountyReviewButton: Locator;

  readonly bountyCommentButton: Locator;

  readonly bountyCommentArea: Locator;

  constructor(page: Page) {
    super(page);
    this.bountyPropertiesConfiguration = page.locator('data-test=bounty-configuration');
    this.bountyPropertyAmount = page.locator('data-test=bounty-property-amount >> input');
    this.bountyHeaderAmount = page.locator('data-test=bounty-header-amount >> data-test=bounty-amount');
    this.bountyApplicantForm = page.locator('data-test=bounty-applicant-form');
    this.bountyReviewButton = page.locator('data-test=review-bounty-button');
    this.bountyCommentButton = page.locator('data-test=comment-button');
    this.bountyCommentArea = page.locator('data-test=comment-form').locator('div[contenteditable]').first();
  }

  getCommentLocator(commentId: string) {
    return this.page.locator(`data-test=comment-${commentId}`);
  }

  getCommentMenuIcon(commentId: string) {
    return this.page.locator(`data-test=comment-menu-${commentId}`);
  }

  getEditCommentButton(commentId: string) {
    return this.page.locator(`data-test=edit-comment-${commentId}`);
  }

  getEditCommentArea(commentId: string) {
    return this.page.locator(`data-test=comment-charmeditor-${commentId}`).locator('div[contenteditable]').first();
  }

  getSaveCommentButton(commentId: string) {
    return this.page.locator(`data-test=save-comment-${commentId}`);
  }
}
