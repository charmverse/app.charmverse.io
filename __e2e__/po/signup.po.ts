// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';
import type { Space } from '@prisma/client';

// capture actions on the pages in signup flow
export class SignUpPage {
  readonly page: Page;

  readonly selectNewWorkspaceButton: Locator;

  readonly workspaceFormSubmit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.selectNewWorkspaceButton = page.locator('data-test=goto-create-workspace');
    this.workspaceFormSubmit = page.locator('data-test=create-workspace');
  }

  async waitForURL() {
    await this.page.waitForURL('**/signup');
  }

  async waitForWorkspaceForm() {
    await this.page.waitForURL('**/createWorkspace');
  }

  async waitForWorkspaceLoaded({ domain }: { domain: string }) {
    await this.page.waitForURL(`**/${domain}`);
    await this.page.locator('text=[Your DAO] Home').first().waitFor();
  }

  async selectCreateWorkspace() {
    await this.selectNewWorkspaceButton.click();
  }

  async submitWorkspaceForm(): Promise<Space> {
    this.workspaceFormSubmit.click();

    const response = await this.page.waitForResponse('**/api/spaces');

    const parsedResponse = await response.json();

    if (response.status() >= 400) {
      throw parsedResponse;
    }

    return parsedResponse as Space;
  }
}
