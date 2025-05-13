import { generateTestOtpToken } from '@packages/testing/userOtp';
import type { Locator, Page } from '@playwright/test';

import { SettingsModal } from './settings.po';

export class AccountTwoFactorAuth extends SettingsModal {
  readonly configTwoFactorAuthBtn: Locator;

  readonly twoFactorAuthNextButton: Locator;

  readonly seeAuthenticationCodeButton: Locator;

  readonly authenticationCode: Locator;

  readonly confirmAuthCode: Locator;

  readonly getQrCodeButton: Locator;

  readonly resetRecoveryCodeButton: Locator;

  readonly confirmResetRecoveryCodeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.configTwoFactorAuthBtn = page.locator('data-test=account-config-twofa-btn');
    this.twoFactorAuthNextButton = page.locator('data-test=two-factor-auth-next');
    this.seeAuthenticationCodeButton = page.locator('data-test=see-auth-confirmation-code');
    this.authenticationCode = page.locator('data-test=auth-confirmation-code');
    this.confirmAuthCode = page.locator('data-test=confirm-auth-code-input >> input');
    this.getQrCodeButton = page.locator('data-test=account-get-qr-code-btn');
    this.resetRecoveryCodeButton = page.locator('data-test=account-reset-recovery-code-btn');
    this.confirmResetRecoveryCodeButton = page.locator('data-testid=confirm-delete-button');
  }

  async getAuthenticationCode() {
    return this.authenticationCode.innerText();
  }

  async inputCode(username: string, code: string) {
    const authCode = generateTestOtpToken(username, code, true);
    await this.confirmAuthCode.fill(authCode);
  }
}
