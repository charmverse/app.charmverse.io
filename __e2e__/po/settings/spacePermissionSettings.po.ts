// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';
import type { SpaceOperation } from '@prisma/client';

import type { SpacePermissionFlags } from 'lib/permissions/spaces';

import { SettingsModal } from './settings.po';

// capture actions on the pages in signup flow
export class PermissionSettings extends SettingsModal {
  readonly spacePermissionsForm: Locator;

  readonly submitSpacePermissionSettingsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.spacePermissionsForm = page.locator('data-test=space-permissions-form-role');
    this.submitSpacePermissionSettingsButton = page.locator(`data-test=submit-space-permission-settings`);
  }

  getExpandRoleContextMenuLocator(roleId: string): Locator {
    return this.page.locator(`data-test=open-role-context-menu-${roleId}`);
  }

  getRoleSpaceOperationSwitchLocator(operation: Exclude<SpaceOperation, 'createForumCategory'>): Locator {
    return this.page.locator(`data-test=space-operation-role-${operation} >> input`);
  }

  async submitSpacePermissionSettings(): Promise<SpacePermissionFlags> {
    this.submitSpacePermissionSettingsButton.click();

    const response = await this.page.waitForResponse('**/api/permissions/space/*/add');

    const parsedResponse = await response.json();

    if (response.status() >= 400) {
      throw parsedResponse;
    }

    return parsedResponse as SpacePermissionFlags;
  }

  async isOperationChecked(operation: Exclude<SpaceOperation, 'createForumCategory'>): Promise<boolean> {
    const toggleWrapper = this.page.locator(`data-test=space-operation-role-${operation}`);
    const operationToggleChecked = await toggleWrapper.getAttribute('class');

    // Couldn't target the input element directly, so had to use the wrapper, and check the class
    return !!operationToggleChecked?.match('Mui-checked');
  }

  getOpenManageRoleSpacePermissionsModalLocator(roleId: string): Locator {
    return this.page.locator(`data-test=open-role-permissions-popup-${roleId}`);
  }
}
