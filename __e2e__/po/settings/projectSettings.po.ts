// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { SettingsModal } from './settings.po';

// capture actions on the pages in signup flow
export class ProjectSettings extends SettingsModal {
  readonly addProjectButton: Locator;

  readonly saveNewProjectButton: Locator;

  readonly saveProjectButton: Locator;

  readonly addProjectMemberButton: Locator;

  readonly deleteProjectMemberButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addProjectMemberButton = page.locator('data-test=add-project-member-button');
    this.addProjectButton = page.locator('data-test=add-project-button');
    this.saveNewProjectButton = page.locator('data-test=save-new-project-button');
    this.saveProjectButton = page.locator('data-test=save-project-button');
    this.deleteProjectMemberButton = page.locator('data-test=delete-project-member-button');
  }

  fillProjectField({
    content,
    fieldName,
    textArea = false
  }: {
    textArea?: boolean;
    fieldName: string;
    content: string;
  }) {
    return this.page.locator(`data-test=project-field-${fieldName} >> .MuiInputBase-input`).first().fill(content);
  }

  getProjectTitle({ projectId }: { projectId: string }) {
    return this.page.locator(`data-test=project-title-${projectId}`).first();
  }

  clickProject({ projectId }: { projectId: string }) {
    return this.page.locator(`data-test=project-title-${projectId}`).first().click();
  }

  getProjectField({ fieldName }: { fieldName: string }) {
    return this.page.locator(`data-test=project-field-${fieldName} >> .MuiInputBase-input`).first();
  }
}
