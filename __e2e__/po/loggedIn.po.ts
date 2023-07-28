// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

// Generic selectors that appear across the app independent of the features
export class LoggedInPage {
  // A utility to close any modal that uses DialogTitle from components/common/Modal/Modal.tsx
  readonly page: Page;

  readonly closeModalLocator: Locator;

  readonly memberOnboardingSkipEmailLocator: Locator;

  readonly memberEmailInputLocator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.closeModalLocator = this.page.locator('data-test=close-modal');
    this.memberOnboardingSkipEmailLocator = this.page.locator('data-test=member-email-skip');
    this.memberEmailInputLocator = this.page.locator('data-test=member-email-input >> input');
  }

  // Utility method for not having the onboarding modal
  async skipOnboarding() {
    const memberEmailInput = this.memberOnboardingSkipEmailLocator;

    await memberEmailInput.click();

    await this.closeModalLocator.click();
  }

  async getEmailInputValue() {
    return this.memberEmailInputLocator.inputValue();
  }
}
