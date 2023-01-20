import { expect, test } from '@playwright/test';

import { baseUrl } from 'config/constants';

import { generateUserAndSpace } from './utils/mocks';
import { login } from './utils/session';

test.describe.serial('Add a new workspace from sidebar and load it', async () => {
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
    // 1. Make sure there is a button to add a new workspace
    const addNewSpaceBtn = page.locator('data-test=sidebar-add-new-space');
    await addNewSpaceBtn.waitFor();

    // 2. Open create space dialod
    await addNewSpaceBtn.click();

    await expect(page.locator('data-test=create-space-form')).toBeVisible();

    const nameInput = page.locator('data-test=workspace-name-input >> input');
    const domainInput = page.locator('data-test=workspace-domain-input');

    // change domain to unique one
    const uniqueDomainName = Math.random().toString().replace('.', '');
    await domainInput.fill(uniqueDomainName);
    await nameInput.fill(uniqueDomainName);
    // submit form
    await page.locator('data-test=create-workspace').click();

    await page.waitForURL(`**/${uniqueDomainName}`);

    // Await new onboarding form popup so we can close it and click on new space
    let closePropertiesModalBtn = await page.locator('data-test=close-member-properties-modal');
    await expect(closePropertiesModalBtn).toBeVisible();
    await closePropertiesModalBtn.click();

    await expect(addNewSpaceBtn).toBeVisible();
    await page.locator('text=[Your DAO] Home').first().waitFor();

    // check sidebar space name
    const sidebarSpaceName = await page.locator('data-test=sidebar-space-name').textContent();
    expect(sidebarSpaceName).toBe(uniqueDomainName);

    // Create and verify 2nd space
    await addNewSpaceBtn.click();
    const uniqueDomainName2 = Math.random().toString().replace('.', '');
    await domainInput.fill(uniqueDomainName2);
    await nameInput.fill(uniqueDomainName2);
    await page.locator('data-test=create-workspace').click();
    await page.waitForURL(`**/${uniqueDomainName2}`);

    // Close the modal again
    closePropertiesModalBtn = await page.locator('data-test=close-member-properties-modal');
    await expect(closePropertiesModalBtn).toBeVisible();
    await closePropertiesModalBtn.click();

    const sidebarSpaceName2 = await page.locator('data-test=sidebar-space-name').textContent();
    expect(sidebarSpaceName2).toBe(uniqueDomainName2);
  });
});
