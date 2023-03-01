// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { baseUrl } from 'config/constants';

import { GlobalPage } from './global.po';

// capture actions on the pages in signup flow
export class BountyPage extends GlobalPage {
  readonly bountyPropertiesConfiguration: Locator;

  // Editable amount field
  readonly bountyPropertyAmount: Locator;

  // Readonly amount field
  readonly bountyHeaderAmount: Locator;

  readonly bountyApplicantForm: Locator;

  constructor(page: Page) {
    super(page);
    this.bountyPropertiesConfiguration = page.locator('data-test=bounty-configuration');
    this.bountyPropertyAmount = page.locator('data-test=bounty-property-amount >> input');
    this.bountyHeaderAmount = page.locator('data-test=bounty-header-amount >> data-test=bounty-amount');
    this.bountyApplicantForm = page.locator('data-test=bounty-applicant-form');
  }
}
