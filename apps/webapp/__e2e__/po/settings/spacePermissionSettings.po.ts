// playwright-dev-page.ts
import type { SpaceOperation } from '@charmverse/core/prisma';
import type { Locator, Page } from '@playwright/test';

import type { SpacePermissionFlags } from '@packages/lib/permissions/spaces';

import { SettingsModal } from './settings.po';

// capture actions on the pages in signup flow
export class PermissionSettings extends SettingsModal {
  readonly spacePermissionsForm: Locator;

  readonly submitSpacePermissionSettingsButton: Locator;

  readonly permissionsTab: Locator;

  constructor(page: Page) {
    super(page);
    this.spacePermissionsForm = page.locator('data-test=space-permissions-form-role');
    this.submitSpacePermissionSettingsButton = page.locator(`data-test=submit-space-permission-settings`);
    this.permissionsTab = page.locator('data-test=role-settings-permissions-tab');
  }

  getRoleSpaceOperationSwitchLocator(operation: Exclude<SpaceOperation, 'createForumCategory'>): Locator {
    return this.page.locator(`data-test=space-operation-${operation} >> input`);
  }

  async submitSpacePermissionSettings() {
    this.submitSpacePermissionSettingsButton.click();

    const response = await this.page.waitForResponse('**/api/permissions/space/*/settings');

    return response;
  }

  async isOperationChecked(operation: Exclude<SpaceOperation, 'createForumCategory'>): Promise<boolean> {
    const toggleWrapper = this.page.locator(`data-test=space-operation-${operation}`);
    const operationToggleChecked = await toggleWrapper.getAttribute('class');

    // Couldn't target the input element directly, so had to use the wrapper, and check the class
    return !!operationToggleChecked?.match('Mui-checked');
  }

  clickRoleRowByTitle(title: string) {
    return this.page.click(`data-test=role-row-${title}`);
  }

  goToRowTab(title: string, tab: 'permissions') {
    return this.page.click(`data-test=role-row-${title} >> data-test=role-settings-${tab}-tab`);
  }

  getSpaceMemberRowLocator(userId: string): Locator {
    return this.page.locator(`data-test=member-row-${userId}`);
  }

  hasEditableMemberLevel(userId: string): Promise<boolean> {
    return this.getEditableMemberLevelLocator(userId).isVisible();
  }

  getEditableMemberLevelLocator(userId: string): Locator {
    return this.page.locator(`data-test=editable-member-level-${userId}`);
  }
}
