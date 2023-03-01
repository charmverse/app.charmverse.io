// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { SettingsModal } from './settings.po';

// capture actions on the pages in signup flow
export class SpaceMembersSettings extends SettingsModal {
  private test: string;

  constructor(page: Page) {
    super(page);
    this.test = 'test';
  }

  getSpaceMemberRowLocator(userId: string): Locator {
    return this.page.locator(`data-test=member-list-item-${userId}`);
  }

  async hasEditableMemberLevel(userId: string): Promise<boolean> {
    return this.getEditableMemberLevelLocator(userId).isVisible();
  }

  getEditableMemberLevelLocator(userId: string): Locator {
    return this.page.locator(`data-test=editable-member-level-${userId}`);
  }
}
