import type { Browser } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';

import { baseUrl } from 'config/constants';

import { createUserAndSpace, generateBounty } from './utils/mocks';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});

test('visit a public bounty a page public', async () => {

  // Arrange ------------------
  const loggedInUserContext = await browser.newContext();
  const publicContext = await browser.newContext();

  const loggedInPage = await loggedInUserContext.newPage();
  const publicPage = await publicContext.newPage();

  const { space } = await createUserAndSpace({ browserPage: loggedInPage, permissionConfigurationMode: 'open' });

  const bounty = await generateBounty({
    spaceId: space.id,
    createdBy: space.createdBy,
    status: 'open',
    approveSubmitters: false,
    rewardAmount: 100,
    rewardToken: 'ETH',
    bountyPermissions: {
      submitter: [{
        group: 'space',
        id: space.id
      }]
    },
    pagePermissions: [
      {
        permissionLevel: 'view',
        spaceId: space.id
      }, {
        permissionLevel: 'view',
        public: true
      }
    ]
  });

  // await togglePublicBounties({ publicBountyBoard: true, spaceId: space.id });

  const publicSharePrefix = `${baseUrl}/share/${space.domain}`;

  const bountyBoard = `${publicSharePrefix}/bounties`;

  // Act

  // Test a logged in user viewing the public board, and a public user viewing the public board
  await Promise.all([loggedInPage, publicPage].map(async (page) => {

    await page.goto(bountyBoard);

    const bountyCard = page.locator(`data-test=bounty-card-${bounty.id}`);

    await expect(bountyCard).toBeVisible();

    await bountyCard.click();

    // 4. Open the card and make sure it renders content
    await page.waitForURL(`${bountyBoard}*bountyId*`);

    const cardPopup = page.locator('div.Dialog');

    await expect(cardPopup).toBeVisible();
    const documentTitle = cardPopup.locator('data-test=editor-page-title');

    await expect(documentTitle).toBeVisible();

    const spaceActionButton = page.locator('data-test=public-bounty-space-action');

    await expect(spaceActionButton).toBeVisible();
  }));

});
