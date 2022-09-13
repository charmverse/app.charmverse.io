import { Browser, chromium, test } from '@playwright/test';
import { createBounty } from 'lib/bounties';
import { togglePublicBounties } from 'lib/spaces/togglePublicBounties';
import { baseUrl, createUserAndSpace } from './utilities';

let browser: Browser;

test.beforeAll(async () => {
  // Set headless to false in chromium.launch to visually debug the test
  browser = await chromium.launch();
});

test('visit a public bounty a page public', async () => {

  // Arrange ------------------
  const userContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await userContext.newPage();

  const { space, pages: spacePages } = await createUserAndSpace({ browserPage: page });

  const bounty = await createBounty({
    spaceId: space.id,
    createdBy: space.createdBy,
    status: 'open',
    rewardAmount: 100,
    rewardToken: 'ETH'
  });

  await togglePublicBounties({ publicBountyBoard: true, spaceId: space.id });

  const bountyBoard = `${baseUrl}/${space.domain}/bounties`;

  // Act
  await page.goto(bountyBoard);

  await page.pause();

});
