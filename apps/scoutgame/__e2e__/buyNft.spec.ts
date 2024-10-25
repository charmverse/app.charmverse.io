import { prisma } from '@charmverse/core/prisma-client';
import { installMockWallet } from '@johanneskares/wallet-mock';
import { getBuilderContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { currentSeason } from '@packages/scoutgame/dates';
import { mockBuilder, mockBuilderNft } from '@packages/scoutgame/testing/database';
import { delay } from '@root/lib/utils/async';
import { custom, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimism, sepolia } from 'viem/chains';

import { expect, test } from './test';

test.describe('Buy Nft', () => {
  test.beforeEach(async ({ page }) => {
    await installMockWallet({
      page,
      account: privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'),
      defaultChain: optimism,
      transports: {
        [optimism.id]: (config) => {
          return custom({
            request: async ({ method, params }) => {
              // console.log('method inside metamask method', method);
              // console.log('method inside metamask params', params);
              // Mock only this RPC call
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
        },
        [sepolia.id]: (config) => {
          return custom({
            request: async ({ method, params }) => {
              // Mock only this RPC call
              if (method === 'eth_estimateGas') {
                return 500000;
              }

              const response = await http()(config).request({ method, params });

              return response;
            }
          })(config);
        }
      }
    });
  });

  test('Should be able to buy an nft', async ({ utils, page }) => {
    const builder = await mockBuilder({
      nftSeason: currentSeason,
      id: '10216fd1-e437-44ee-acb8-ba1813017c26',
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

    // Used for catching all the requests
    // await page.route('**', (route) => {
    //   console.log('Intercepted URL:', route.request().url());
    //   route.continue();
    // });
    // await page.route(`**/u/${builder.username}`, async (route, request) => {
    //   const method = request.method();
    //   if (method !== 'POST') {
    //     await route.continue();
    //   }
    // console.log('body', body);
    // await route.continue();
    // await route.fulfill({
    //   status: 200,
    //   json: { success: true }
    // });
    // });

    await page.route('**/api/getTokens**', async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            chainId: 10,
            address: '0x0000000000000000000000000000000000000000',
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
            isNative: true,
            logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=025',
            balanceFloat: 0.023361258953913493,
            balance: '23361258953913492n'
          },
          {
            chainId: 10,
            address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logo: 'https://box-v2.api.decent.xyz/tokens/usdc.png',
            isNative: false,
            balanceFloat: 727.9495,
            balance: '727949500n'
          },
          {
            chainId: 10,
            address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logo: 'https://box-v2.api.decent.xyz/tokens/usdc.png',
            isNative: false,
            balanceFloat: 0.004414,
            balance: '4414n'
          },
          {
            chainId: 10,
            address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            name: 'Dai Stablecoin',
            symbol: 'DAI',
            decimals: 18,
            logo: 'https://static.alchemyapi.io/images/assets/4943.png',
            isNative: false,
            balanceFloat: 0,
            balance: '0n'
          },
          {
            chainId: 10,
            address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            logo: 'https://static.alchemyapi.io/images/assets/825.png',
            isNative: false,
            balanceFloat: 0,
            balance: '0n'
          },
          {
            chainId: 10,
            address: '0x4200000000000000000000000000000000000006',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            logo: 'https://static.alchemyapi.io/images/assets/2396.png',
            isNative: false,
            balanceFloat: 5.631566611e-9,
            balance: '5631566611n'
          },
          {
            chainId: 10,
            address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
            name: 'Wrapped BTC',
            symbol: 'WBTC',
            decimals: 8,
            logo: 'https://static.alchemyapi.io/images/assets/3717.png',
            isNative: false,
            balanceFloat: 0,
            balance: '0n'
          },
          {
            chainId: 10,
            address: '0x4200000000000000000000000000000000000042',
            name: 'Optimism',
            symbol: 'OP',
            decimals: 18,
            logo: 'https://optimistic.etherscan.io/token/images/optimism_32.png',
            isNative: false,
            balanceFloat: 0,
            balance: '0n'
          }
        ]
      });
    });

    await page.route('**/**/api/getBoxAction**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          tx: {
            to: '0x1572D48a52906B834FB236AA77831d669F6d87A1',
            chainId: 10,
            data: '0x62ae41170000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000004a000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000743ec903fe6d05e73b19a6db807271bb66100e83000000000000000000000000743ec903fe6d05e73b19a6db807271bb66100e830000000000000000000000005a4d8d2f5de4d6ae29a91ee67e3adaedb53b0081000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000000600000000000000000000000001572d48a52906b834fb236aa77831d669f6d87a10000000000000000000000005a4d8d2f5de4d6ae29a91ee67e3adaedb53b00810000000000000000000000000000000000000000000000000013d653ffed83d20000000000000000000000000000000000000000000000000000000000d59f8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b2c639c533813f4aa9d7837caf62653d097ff85000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000002b0b2c639c533813f4aa9d7837caf62653d097ff85000064420000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e4bb7fde710000000000000000000000005a4d8d2f5de4d6ae29a91ee67e3adaedb53b0081000000000000000000000000000000000000000000000000000000000000002900000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000002435663566343537382d393236392d346633302d393963632d3130616231356565303630630000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b812f17c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041a4f424514cb6555ebb4d92ab371a69d4c9a7f0aca26cd9e0ec6a17df684870e222cad453ac4a7796846396b024116d571988273057d5eaed123969b1cb24b5651c00000000000000000000000000000000000000000000000000000000000000',
            value: '5680381238874219n'
          },
          tokenPayment: {
            amount: '5583680821887954n',
            tokenAddress: '0x0000000000000000000000000000000000000000',
            chainId: 10,
            isNative: true,
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          amountOut: {
            amount: '14000000n',
            tokenAddress: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
            chainId: 10,
            isNative: false,
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6
          },
          protocolFee: {
            amount: '96700416986265n',
            tokenAddress: '0x0000000000000000000000000000000000000000',
            chainId: 10,
            isNative: true,
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          applicationFee: {
            amount: '0n',
            tokenAddress: '0x0000000000000000000000000000000000000000',
            chainId: 10,
            isNative: true,
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          exchangeRate: 2507.3066399354684,
          estimatedTxTime: 0,
          estimatedPriceImpact: null
        }
      });
    });

    await utils.loginAsUserId(builder.id);
    await page.goto(`/home`);
    await page.waitForURL('**/home');

    await page.goto(`/u/${builder.username}`);
    await page.waitForURL(`**/u/${builder.username}`);

    // Card buy NFT button
    const scoutButton = page.locator('data-test=scout-button').first();
    await scoutButton.click();

    const buyButton = page.locator('data-test=purchase-button').first();
    await buyButton.click();

    const successView = page.locator('data-test=success-view');
    await expect(successView).toBeVisible();
  });
});
