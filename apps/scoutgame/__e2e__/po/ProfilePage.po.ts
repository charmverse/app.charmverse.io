import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class ProfilePage extends GeneralPageLayout {
  constructor(protected page: Page, public container = page.locator('data-test=profile-page')) {
    super(page);
  }
}
