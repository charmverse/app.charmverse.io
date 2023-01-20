import type { Browser } from '@playwright/test';
import { expect, test, chromium } from '@playwright/test';
import type { Bounty, User } from '@prisma/client';

import { baseUrl } from 'config/constants';

import { generateUserAndSpace, generateBounty } from './utils/mocks';
import { login } from './utils/session';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});

test.describe.serial('Make a bounties page public and visit it', async () => {
  let spaceUser: User;
  let bountyBoard: string;
  let bounty: Bounty;

  test('visit a public bounty page', async ({ page }) => {
    const { space, user } = await generateUserAndSpace({
      publicBountyBoard: true
    });

    spaceUser = user;

    bounty = await generateBounty({
      spaceId: space.id,
      createdBy: space.createdBy,
      status: 'open',
      approveSubmitters: false,
      rewardAmount: 100,
      rewardToken: 'ETH',
      bountyPermissions: {
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      },
      pagePermissions: [
        {
          permissionLevel: 'view',
          spaceId: space.id
        },
        {
          permissionLevel: 'view',
          public: true
        }
      ]
    });

    // await togglePublicBounties({ publicBountyBoard: true, spaceId: space.id });

    const publicSharePrefix = `${baseUrl}/${space.domain}`;

    bountyBoard = `${publicSharePrefix}/bounties`;

    // Act

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

    // 5. Make sure page is displayed using public layout
    const publicPageLayout = page.locator('data-test=public-page-layout');
    await expect(publicPageLayout).toBeVisible();
  });

  test('visit shared bounties page as logged in user', async () => {
    const userContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });

    const page = await userContext.newPage();
    await login({ userId: spaceUser.id, page });

    // 1. Visit the page
    await page.goto(bountyBoard);

    // 2. Make sure the board renders
    const bountyCard = page.locator(`data-test=bounty-card-${bounty.id}`);

    await expect(bountyCard).toBeVisible();

    // 3. Make sure page is displayed using space layout
    const spacePageLayout = page.locator('data-test=space-page-layout');
    await expect(spacePageLayout).toBeVisible();
  });
});
