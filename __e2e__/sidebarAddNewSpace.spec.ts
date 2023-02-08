import { expect, test } from '@playwright/test';
import type { Space } from '@prisma/client';

import { baseUrl } from 'config/constants';

import { generateUserAndSpace } from './utils/mocks';
import { login } from './utils/session';

test.describe.serial('Add a new space from sidebar and load it', async () => {
  test('Fill the form and create a new space', async ({ page }) => {
    // Arrange ------------------
    // const userContext = await browser.newContext();
    // const page = await userContext.newPage();

    const { space, user } = await generateUserAndSpace();

    await login({ page, userId: user.id });

    const domain = space.domain;
    const targetPage = `${baseUrl}/${domain}`;

    await page.goto(targetPage);
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // Act ----------------------
    // Part A - Prepare the page as a logged in user
    // 1. Click on the space menu button to open the dropdown
    const spaceMenuBtn = page.locator('data-test=sidebar-space-menu');
    await spaceMenuBtn.click();

    // 2. Make sure there is a button to add a new space
    const addNewSpaceBtn = page.locator('data-test=spaces-menu-add-new-space');
    await addNewSpaceBtn.waitFor();

    // 3. Open create space dialog
    await addNewSpaceBtn.click();

    const defaultTemplateButton = page.locator('data-test=space-template-default');

    await expect(defaultTemplateButton).toBeVisible();

    await defaultTemplateButton.click();

    await expect(page.locator('data-test=create-space-form')).toBeVisible();

    const nameInput = page.locator('data-test=workspace-name-input >> input');

    // change domain to unique one
    const spaceName = Math.random().toString().replace('.', '');

    await nameInput.fill(spaceName);
    // submit form
    page.locator('data-test=create-workspace').click();

    // Intercept the response from the form
    const response = await page.waitForResponse('**/api/spaces');
    const createdSpace = (await response.json()) as Space;
    await page.waitForURL(`**/${createdSpace.domain}`);

    const memberEmailInput = await page.locator('data-test=member-email-input >> input');
    await memberEmailInput.fill('john.doe@gmail.com');

    const memberEmailNextButton = await page.locator('data-test=member-email-next');
    await memberEmailNextButton.click();

    // Await new onboarding form popup so we can close it and click on new space
    let closePropertiesModalBtn = await page.locator('data-test=close-member-properties-modal');
    await expect(closePropertiesModalBtn).toBeVisible();
    await closePropertiesModalBtn.click();

    await page.locator('text=[Your DAO] Home').first().waitFor();

    // check sidebar space name
    const sidebarSpaceName = await page.locator('data-test=sidebar-space-name').textContent();
    expect(sidebarSpaceName).toBe(createdSpace.domain);

    // Create and verify 2nd space
    await spaceMenuBtn.click();
    await addNewSpaceBtn.click();
    await defaultTemplateButton.click();

    const uniqueDomainName2 = Math.random().toString().replace('.', '');

    await nameInput.fill(uniqueDomainName2);
    await page.locator('data-test=create-workspace').click();
    await page.waitForURL(`**/${uniqueDomainName2}`);

    // Since the user has filled their email it should not show member-email-modal again
    const memberEmailModal = await page.locator('data-test=member-email-modal');
    await expect(memberEmailModal).not.toBeVisible();

    // Close the modal again
    closePropertiesModalBtn = await page.locator('data-test=close-member-properties-modal');
    await expect(closePropertiesModalBtn).toBeVisible();
    await closePropertiesModalBtn.click();

    const sidebarSpaceName2 = await page.locator('data-test=sidebar-space-name').textContent();
    expect(sidebarSpaceName2).toBe(uniqueDomainName2);
  });
});
