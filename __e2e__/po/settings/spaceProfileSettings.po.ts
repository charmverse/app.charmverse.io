// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { SettingsModal } from './settings.po';

// capture actions on the pages in signup flow
export class SpaceProfileSettings extends SettingsModal {
  readonly spaceNameInput: Locator;

  readonly spaceDomainInput: Locator;

  readonly submitSpaceUpdateButton: Locator;

  readonly deleteSpaceButton: Locator;

  readonly confirmDeleteSpaceButton: Locator;

  readonly bountyVisibilityToggle: Locator;

  readonly forumVisibilityToggle: Locator;

  readonly memberDirectoryVisibilityToggle: Locator;

  readonly proposalsVisibilityToggle: Locator;

  constructor(page: Page) {
    super(page);
    this.spaceNameInput = page.locator('data-test=space-name-input >> input');
    this.spaceDomainInput = page.locator('data-test=space-domain-input >> input');
    this.submitSpaceUpdateButton = page.locator('data-test=submit-space-update');
    this.deleteSpaceButton = page.locator('data-test=submit-space-delete');
    this.confirmDeleteSpaceButton = page.locator('data-test=confirm-delete-button');

    // Space feature visibility toggles
    this.bountyVisibilityToggle = page.locator(`data-test=space-feature-toggle-bounties`);
    this.forumVisibilityToggle = page.locator(`data-test=space-feature-toggle-forum`);
    this.memberDirectoryVisibilityToggle = page.locator(`data-test=space-feature-toggle-member_directory`);
    this.proposalsVisibilityToggle = page.locator(`data-test=space-feature-toggle-proposals >> input`);
  }
}
