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

  readonly bountyVisibility: Locator;

  readonly forumVisibility: Locator;

  readonly memberDirectoryVisibility: Locator;

  readonly proposalsVisibility: Locator;

  readonly proposalsVisibilityMenu: Locator;

  readonly proposalsVisibilityHideAction: Locator;

  readonly proposalsVisibilityShowAction: Locator;

  readonly profileCharmverseItem: Locator;

  readonly profileCharmverseItemMenu: Locator;

  readonly profileHideAction: Locator;

  readonly profileOpenAddProfilesModal: Locator;

  readonly profileAddProfilesModal: Locator;

  readonly profileAddCharmverseProfileButton: Locator;

  constructor(page: Page) {
    super(page);
    this.spaceNameInput = page.locator('data-test=space-name-input >> input');
    this.spaceDomainInput = page.locator('data-test=space-domain-input >> input');
    this.submitSpaceUpdateButton = page.locator('data-test=submit-space-update');
    this.deleteSpaceButton = page.locator('data-test=submit-space-delete');
    this.confirmDeleteSpaceButton = page.locator('data-testid=confirm-delete-button');

    // Space features
    this.bountyVisibility = page.locator(`data-test=settings-feature-item-bounties`);
    this.forumVisibility = page.locator(`data-test=settings-feature-item-forum`);
    this.memberDirectoryVisibility = page.locator(`data-test=settings-feature-item-member_directory`);
    this.proposalsVisibility = page.locator(`data-test=settings-feature-item-proposals`);
    this.proposalsVisibilityMenu = page.locator(`data-test=settings-feature-item-proposals >> button`);
    this.proposalsVisibilityHideAction = page.locator(`data-test=settings-feature-option-hide`);
    this.proposalsVisibilityShowAction = page.locator(`data-test=settings-feature-option-show`);

    // Space member profiles
    this.profileCharmverseItem = page.locator(`data-test=settings-profiles-item-charmverse`);
    this.profileCharmverseItemMenu = page.locator(`data-test=settings-profiles-item-charmverse >> button`);
    this.profileHideAction = page.locator(`data-test=settings-profiles-option-hide`);
    this.profileOpenAddProfilesModal = page.locator(`data-test=settings-add-profiles-button`);
    this.profileAddProfilesModal = page.locator(`data-test=add-profiles-modal`);
    this.profileAddCharmverseProfileButton = page.locator(`data-test=add-profile-button-charmverse`);
  }
}
