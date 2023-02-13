// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import type { SpaceSettingsSection } from 'components/settings/pages';
import { baseUrl } from 'config/constants';

// capture actions on the pages in signup flow
export class SpaceSettings {
  readonly page: Page;

  readonly spaceNameInput: Locator;

  readonly spaceDomainInput: Locator;

  readonly submitSpaceUpdateButton: Locator;

  readonly settingsBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.spaceNameInput = page.locator('data-test=space-name-input >> input');
    this.spaceDomainInput = page.locator('data-test=space-domain-input >> input');
    this.submitSpaceUpdateButton = page.locator('data-test=submit-space-update');
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
