import { test as base } from '@playwright/test';
import { AccountTwoFactorAuth } from '__e2e__/po/settings/accountTwoFactorAuth.po';
import { SpaceProfileSettings } from '__e2e__/po/settings/spaceProfileSettings.po';
import { generateUserAndSpace } from '__e2e__/utils/mocks';
import { login } from '__e2e__/utils/session';
import { v4 as uuid } from 'uuid';

type Fixtures = {
  spaceSettings: SpaceProfileSettings;
  accountTwoFactorAuth: AccountTwoFactorAuth;
};

const test = base.extend<Fixtures>({
  spaceSettings: ({ page }, use) => use(new SpaceProfileSettings(page)),
  accountTwoFactorAuth: ({ page }, use) => use(new AccountTwoFactorAuth(page))
});

test('Account settings - Two Factor Authentication flow', async ({ page, spaceSettings, accountTwoFactorAuth }) => {
  const { space, user: spaceUser } = await generateUserAndSpace({
    spaceName: `cvt-${uuid()}`,
    spaceDomain: `cvt-${uuid()}`,
    isAdmin: true,
    onboarded: true
  });

  // go to a page to which we don't have access

  await login({ page, userId: spaceUser.id });

  await spaceSettings.goTo(space.domain);

  await spaceSettings.waitForSpaceSettingsURL();

  await spaceSettings.openSettingsModal();

  await spaceSettings.goToTab('account');

  await accountTwoFactorAuth.configTwoFactorAuthBtn.click();

  await accountTwoFactorAuth.twoFactorAuthNextButton.click();

  await accountTwoFactorAuth.seeAuthenticationCodeButton.click();

  const authCode = await accountTwoFactorAuth.getAuthenticationCode();

  await accountTwoFactorAuth.twoFactorAuthNextButton.click();

  await accountTwoFactorAuth.inputCode(spaceUser.username, authCode);

  await accountTwoFactorAuth.twoFactorAuthNextButton.click();

  await accountTwoFactorAuth.twoFactorAuthNextButton.click();

  await accountTwoFactorAuth.getQrCodeButton.click();

  await accountTwoFactorAuth.inputCode(spaceUser.username, authCode);

  await accountTwoFactorAuth.twoFactorAuthNextButton.click();

  await accountTwoFactorAuth.twoFactorAuthNextButton.click();

  await accountTwoFactorAuth.resetRecoveryCodeButton.click();

  await accountTwoFactorAuth.confirmResetRecoveryCodeButton.click();

  await accountTwoFactorAuth.inputCode(spaceUser.username, authCode);

  await accountTwoFactorAuth.twoFactorAuthNextButton.click();

  await accountTwoFactorAuth.twoFactorAuthNextButton.click();
});
