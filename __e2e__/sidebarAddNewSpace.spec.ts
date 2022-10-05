import type { Browser } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';
import type { Page } from '@prisma/client';

import { baseUrl } from 'config/constants';
import { prisma } from 'db';
import type { IPageWithPermissions } from 'lib/pages/interfaces';

import { createUserAndSpace } from './utils/mocks';
import { mockWeb3 } from './utils/web3';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});

test.describe.serial('Add a new workspace from sidebar and load it', async () => {
  test('Fill the form and create a new space', async () => {

    // Arrange ------------------
    const userContext = await browser.newContext();
    const page = await userContext.newPage();

    const { space, address, privateKey } = await createUserAndSpace({ browserPage: page });

    await mockWeb3({
      page,
      context: { address, privateKey },
      init: ({ Web3Mock, context }) => {

        Web3Mock.mock({
          blockchain: 'ethereum',
          accounts: {
            return: [context.address]
          }
        });

      }
    });

    const domain = space.domain;
    const targetPage = `${baseUrl}/${domain}`;

    await page.goto(targetPage);

    // Act ----------------------
    // Part A - Prepare the page as a logged in user
    // 1. Make sure there is a button to add a new workspace
    const addNewSpaceBtn = page.locator('data-test=sidebar-add-new-space');
    await expect(addNewSpaceBtn).toBeVisible();

    // 2. Open create space dialod
    await addNewSpaceBtn.click();

    await expect(page.locator('data-test=create-space-form')).toBeVisible();

    const nameInput = page.locator('data-test=workspace-name-input >> input');
    const domainInput = page.locator('data-test=workspace-domain-input');
    const defaultSpaceName = await nameInput.inputValue();
    const defaultSpaceDomain = await domainInput.inputValue();

    expect(defaultSpaceName).toBeDefined();
    expect(defaultSpaceName).toEqual(defaultSpaceDomain);

    await nameInput.fill('test-space-name');
    // udpate domain input when name changes
    expect(await domainInput.inputValue()).toEqual('testspacename');

    // change domain to unique one
    const uniqueDomainName = Math.random().toString().replace('.', '');
    await domainInput.fill(uniqueDomainName);
    await nameInput.fill(uniqueDomainName);
    // submit form
    await page.locator('data-test=create-workspace').click();

    await page.waitForURL(`**/${uniqueDomainName}`);

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

    const sidebarSpaceName2 = await page.locator('data-test=sidebar-space-name').textContent();
    expect(sidebarSpaceName2).toBe(uniqueDomainName2);
  });

});

