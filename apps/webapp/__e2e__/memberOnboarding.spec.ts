import { generateSpaceForUser } from '@packages/testing/utils/spaces';
import { baseUrl } from '@packages/config/constants';
import { expect, test } from '__e2e__/testWithFixtures';

import { generateUserAndSpace } from './utils/mocks';
import { login } from './utils/session';

test.describe('Create two spaces and visit to check cv and space onboarding modal', async () => {
  // test fails sometimes on line: expect(loggedInPage.memberEmailNextButton).toBeDisabled();
  test.skip('Fill the form and create a new space', async ({ page, loggedInPage }) => {
    const { space, user } = await generateUserAndSpace({
      skipOnboarding: false,
      email: undefined
    });

    await login({ page, userId: user.id });

    let domain = space.domain;
    let targetPage = `${baseUrl}/${domain}`;

    await page.goto(targetPage);
    await page.waitForURL(`${targetPage}/*`);

    expect(loggedInPage.memberEmailNextButton).toBeDisabled();

    // Turn off member email notifications checkbox so that we can proceed to next step without providing email
    await loggedInPage.memberEmailNotificationsCheckbox.click();
    await loggedInPage.memberTermsAndConditionsCheckbox.click();
    expect(loggedInPage.memberEmailNotificationsCheckbox).not.toBeChecked();
    expect(loggedInPage.memberTermsAndConditionsCheckbox).toBeChecked();
    await loggedInPage.memberEmailNextButton.click();

    const memberProfileNftList = page.locator('data-test=member-profile-nft-list');
    const memberProfilePoapList = page.locator('data-test=member-profile-poap-list');
    await expect(memberProfileNftList).toBeVisible();
    await expect(memberProfilePoapList).toBeVisible();

    let closePropertiesModalBtn = page.locator('data-test=close-modal');
    await expect(closePropertiesModalBtn).toBeVisible();
    await closePropertiesModalBtn.click();

    const space2 = await generateSpaceForUser({ user, skipOnboarding: false });
    // Go to another space and check if the cv onboarding modal is visible
    domain = space2.domain;
    targetPage = `${baseUrl}/${domain}`;

    await page.goto(targetPage);
    await page.waitForURL(`${targetPage}/*`);

    closePropertiesModalBtn = page.locator('data-test=close-modal');
    await expect(closePropertiesModalBtn).toBeVisible();
    await closePropertiesModalBtn.click();
  });
});
