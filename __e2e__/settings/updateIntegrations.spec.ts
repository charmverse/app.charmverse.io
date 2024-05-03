import { test as base, expect } from '@playwright/test';
import { IntegrationsSettings } from '__e2e__/po/settings/integrationsSettings.po';
import { v4 } from 'uuid';

import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  spaceSettings: IntegrationsSettings;
};

const test = base.extend<Fixtures>({
  spaceSettings: ({ page }, use) => use(new IntegrationsSettings(page))
});

test('Space settings - add kyc integrations', async ({ page, spaceSettings }) => {
  const { space, user: spaceUser } = await generateUserAndSpace({ spaceName: v4(), isAdmin: true, onboarded: true });

  await spaceSettings.page.route(`**/api/spaces/${space.id}/kyc-credentials/synaps`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ session_id: '12345' })
    });
  });

  await login({ page, userId: spaceUser.id });

  await spaceSettings.goTo(space.domain);
  await spaceSettings.waitForSpaceSettingsURL();

  await spaceSettings.openSettingsModal();
  await spaceSettings.goToTab('integrations');

  await spaceSettings.connectButton.click(); // open the form
  await expect(spaceSettings.saveButton).toBeDisabled();
  await expect(spaceSettings.kycOption).toHaveValue('');

  await spaceSettings.kycOption.fill('synaps');
  await spaceSettings.synapsApiKey.fill('test-api-key');
  await spaceSettings.synapsSecret.fill('test-secret');
  await spaceSettings.saveButton.click();
  await expect(spaceSettings.synapsKycButton).toBeVisible();
  await expect(spaceSettings.synapsKycButton).toBeEnabled();
  await spaceSettings.synapsKycButton.click();
  await spaceSettings.modalCancelButton.click();

  await spaceSettings.kycOption.fill('persona');
  await spaceSettings.personaApiKey.fill('persona_test_api_key');
  await spaceSettings.personaSecret.fill('wbhsec_test_secret');
  await spaceSettings.personaTemplateId.fill('itmpl_test-template-id');
  await spaceSettings.saveButton.click();
  await expect(spaceSettings.personaKycButton).toBeVisible();
  await expect(spaceSettings.personaKycButton).toBeEnabled();
});
