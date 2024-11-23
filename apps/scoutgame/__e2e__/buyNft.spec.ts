import { prisma } from '@charmverse/core/prisma-client';
import { getBuilderContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { currentSeason } from '@packages/scoutgame/dates';
import { mockBuilder, mockScout, mockBuilderNft } from '@packages/scoutgame/testing/database';

import { expect, test } from './test';

test.describe('Buy Nft', () => {
  let address: string;

  test.beforeEach(async ({ utils }) => {
    const { account } = await utils.initMockWallet();
    address = account.address;
  });

  test('Should be able to buy an nft', async ({ utils, page, userPage }) => {
    // Only for testing locally. Ensure the database is clean
    // await prisma.scout.deleteMany({});
    const builder = await mockBuilder({
      nftSeason: currentSeason,
      avatar:
        'https://cdn.charmverse.io/user-content/5906c806-9497-43c7-9ffc-2eecd3c3a3ec/cbed10a8-4f05-4b35-9463-fe8f15413311/b30047899c1514539cc32cdb3db0c932.jpg',
      bio: 'Software Engineer @charmverse.',
      builderStatus: 'approved',
      sendMarketing: false,
      farcasterId: Math.floor(Math.random() * 1000000),
      agreedToTermsAt: new Date('2024-10-03T11:03:00.308Z'),
      onboardedAt: new Date('2024-10-03T11:03:02.071Z'),
      currentBalance: 200
    });

    const builderNft = await mockBuilderNft({
      builderId: builder.id,
      chainId: 10,
      contractAddress: getBuilderContractAddress(),
      tokenId: Math.floor(Math.random() * 1000000)
    });

    await userPage.mockNftAPIs({
      builder: {
        id: builder.id,
        path: builder.path
      },
      isSuccess: true
    });

    await utils.loginAsUserId(builder.id);
    await page.goto(`/home`);
    await page.waitForURL('**/home');

    await page.goto(`/u/${builder.path}`);
    await page.waitForURL(`**/u/${builder.path}`);

    // Card CTA button
    const scoutButton = page.locator('data-test=scout-button').first();
    await scoutButton.click();

    // NFT buy button
    const buyButton = page.locator('data-test=purchase-button').first();
    await buyButton.click();

    // Success view after purchase
    const successView = page.locator('data-test=success-view');
    await expect(successView).toBeVisible();

    // Success message from snackbar
    const successMessage = page.locator('data-test=snackbar-success');
    await expect(successMessage).toBeVisible();

    // Check that the scout wallet was created
    const scoutWallet = await prisma.scoutWallet.findFirst({
      where: {
        address: address.toLowerCase()
      }
    });

    expect(scoutWallet).toBeDefined();
    expect(scoutWallet?.scoutId).toEqual(builder.id);
  });

  test('Should not be able to buy an nft if the scout wallet already exists', async ({ utils, page, userPage }) => {
    const otherScout = await mockScout();
    await prisma.scoutWallet.create({
      data: {
        address: address.toLowerCase(),
        scoutId: otherScout.id
      }
    });

    const builder = await mockBuilder({
      nftSeason: currentSeason,
      avatar:
        'https://cdn.charmverse.io/user-content/5906c806-9497-43c7-9ffc-2eecd3c3a3ec/cbed10a8-4f05-4b35-9463-fe8f15413311/b30047899c1514539cc32cdb3db0c932.jpg',
      bio: 'Software Engineer @charmverse.',
      builderStatus: 'approved',
      sendMarketing: false,
      farcasterId: Math.floor(Math.random() * 1000000),
      agreedToTermsAt: new Date('2024-10-03T11:03:00.308Z'),
      onboardedAt: new Date('2024-10-03T11:03:02.071Z'),
      currentBalance: 200
    });

    const builderNft = await mockBuilderNft({
      builderId: builder.id,
      chainId: 10,
      contractAddress: getBuilderContractAddress(),
      tokenId: Math.floor(Math.random() * 1000000)
    });

    await userPage.mockNftAPIs({
      builder: {
        id: builder.id,
        path: builder.path
      },
      isSuccess: true
    });

    await utils.loginAsUserId(builder.id);
    await page.goto(`/home`);
    await page.waitForURL('**/home');

    await page.goto(`/u/${builder.path}`);
    await page.waitForURL(`**/u/${builder.path}`);

    // Card CTA button
    const scoutButton = page.locator('data-test=scout-button').first();
    await scoutButton.click();

    // NFT buy button
    await expect(page.locator('data-test=purchase-button').first()).toBeDisabled();
    expect(await page.locator('data-test=address-error')).toBeVisible();
  });
});
