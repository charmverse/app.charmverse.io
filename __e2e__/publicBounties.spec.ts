import { expect, test } from '@playwright/test';

import { baseUrl } from 'config/constants';

import { generateUserAndSpace, generateBounty } from './utils/mocks';

test('visit a public bounty page', async ({ page }) => {
  const { space } = await generateUserAndSpace({
    publicBountyBoard: true
  });

  const bounty = await generateBounty({
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

  const publicSharePrefix = `${baseUrl}/share/${space.domain}`;

  const bountyBoard = `${publicSharePrefix}/bounties`;

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
});
