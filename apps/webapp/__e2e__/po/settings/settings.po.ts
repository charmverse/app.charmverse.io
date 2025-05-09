// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';
import { baseUrl } from '@packages/config/constants';

import type { AccountSettingsSection, SpaceSettingsSection } from 'components/settings/config';

import { GlobalPage } from '../global.po';

// capture actions on the pages in signup flow
export class SettingsModal extends GlobalPage {
  readonly page: Page;

  readonly settingsBtn: Locator;

  readonly closeModalButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.settingsBtn = page.locator('data-test=sidebar-settings');
    this.closeModalButton = page.locator('data-test=close-settings-modal');
  }

  async goTo(domain: string) {
    await this.page.goto(`${baseUrl}/${domain}`);
  }

  async openSettingsModal() {
    await this.settingsBtn.click();
  }

  getActivePath({ activePath }: { activePath: string }): Locator {
    return this.page.locator(`[data-test-active-path=${activePath}]`);
  }

  getSpaceSettingsSectionLocator(section: SpaceSettingsSection | AccountSettingsSection): Locator {
    return this.page.locator(`data-test=space-settings-tab-${section}`);
  }

  async goToTab(section: SpaceSettingsSection | AccountSettingsSection) {
    const tab = this.getSpaceSettingsSectionLocator(section);
    await tab.click();
  }

  async waitForSpaceSettingsURL(domain?: string) {
    if (domain) {
      await this.page.waitForURL(`**/${domain}/*`);
    } else {
      await this.page.waitForURL('**/*');
    }
  }
}
