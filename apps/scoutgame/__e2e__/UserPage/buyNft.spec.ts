import { prisma } from '@charmverse/core/prisma-client';
import { getBuilderContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { currentSeason } from '@packages/scoutgame/dates';
import { mockBuilder, mockBuilderNft } from '@packages/scoutgame/testing/database';
import { delay } from '@root/lib/utils/async';
import { custom, http } from 'viem';
import { optimism } from 'viem/chains';

import { expect, test } from '../test';

test.describe('Buy Nft', () => {
  test.beforeEach(async ({ utils }) => {
    utils.initMockWallet({
      [optimism.id]: (config) => {
        return custom({
          request: async ({ method, params }) => {
            if (method === 'eth_estimateGas') {
              return 500000;
            }

            if (method === 'eth_sendRawTransaction') {
              return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            }

            const response = await http()(config).request({ method, params });

            return response;
          }
        })(config);
      }
    });
  });

  test('Should be able to buy an nft', async ({ utils, page, userPage }) => {
    const builderId = '10216fd1-e437-44ee-acb8-ba1813017c26';

    // Ensure that the builder is deleted in case we are using it in another place or just running it locally multiple times.
    await prisma.scout.delete({
      where: {
        id: builderId
      }
    });

    const builder = await mockBuilder({
      nftSeason: currentSeason,
      id: builderId,
      avatar:
        'https://cdn.charmverse.io/user-content/5906c806-9497-43c7-9ffc-2eecd3c3a3ec/cbed10a8-4f05-4b35-9463-fe8f15413311/b30047899c1514539cc32cdb3db0c932.jpg',
      bio: 'Software Engineer @charmverse. Building @scoutgamexyz',
      builderStatus: 'approved',
      sendMarketing: false,
      farcasterId: 23,
      agreedToTermsAt: new Date('2024-10-03T11:03:00.308Z'),
      onboardedAt: new Date('2024-10-03T11:03:02.071Z'),
      currentBalance: 200
    });

    const builderNft = await mockBuilderNft({
      builderId: builder.id,
      chainId: 10,
      // This is the op mainnet real contract
      contractAddress: getBuilderContractAddress(),
      tokenId: 1
    });

    await userPage.mockNftAPIs({
      builder,
      isSuccess: true
    });

    await utils.loginAsUserId(builder.id);
    await page.goto(`/home`);
    await page.waitForURL('**/home');

    await page.goto(`/u/${builder.username}`);
    await page.waitForURL(`**/u/${builder.username}`);

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
  });
});
