// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import type { SpaceSettingsSection } from 'components/settings/pages';
import { baseUrl } from 'config/constants';

// capture actions on the pages in signup flow
export class SettingsModal {
  readonly page: Page;

  readonly settingsBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.settingsBtn = page.locator('data-test=sidebar-settings');
  }

  async goTo(domain: string) {
    await this.page.goto(`${baseUrl}/${domain}`);
  }

  async openSettingsModal() {
    await this.settingsBtn.click();
  }

  getSpaceSettingsLocator(spaceId: string): Locator {
    return this.page.locator(`data-test=space-settings-tab-${spaceId}`);
  }

  getSpaceSettingsSectionLocator({ spaceId, section }: { spaceId: string; section: SpaceSettingsSection }): Locator {
    return this.page.locator(`data-test=space-settings-tab-${spaceId}-${section}`);
  }

  async isSpaceSettingsExpanded(spaceId: string): Promise<boolean> {
    const locator = this.getSpaceSettingsLocator(spaceId);
    const expanded = await locator.getAttribute('aria-expanded');
    return expanded === 'true';
  }

  async goToTab({ spaceId, section }: { spaceId: string; section: SpaceSettingsSection }) {
    const tab = this.getSpaceSettingsSectionLocator({ spaceId, section });
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
