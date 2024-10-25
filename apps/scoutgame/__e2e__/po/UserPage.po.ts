import type { Page } from '@playwright/test';

import { GeneralPageLayout } from './GeneralPageLayout.po';

export class UserPage extends GeneralPageLayout {
  constructor(protected page: Page) {
    super(page);
  }

  async mockNftAPIs({ builder, isSuccess }: { builder: { id: string; username: string }; isSuccess: boolean }) {
    // Used for debugging all routes. Keep caution as the next page.route() function will not run anymore.
    // await page.route('**', (route) => {
    //   console.log('Intercepted URL:', route.request().url());
    //   route.continue();
    // });

    await this.page.route('**/**/api/getTokens**', async (route) => {
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

    // Mock the builder id verification and contract
    await this.page.route('https://mainnet.optimism.io/', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          jsonrpc: '2.0',
          id: 1,
          result:
            '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000800000000000000000000000005a4d8d2f5de4d6ae29a91ee67e3adaedb53b0081000000000000000000000000a2c122be93b0074270ebee7f6b7292c7deb450470000000000000000000000004976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41000000000000000000000000000000000000000000000000000000000000000c76616c336e74696e2e6574680000000000000000000000000000000000000000'
        }
      });
    });

    await this.page.route('**/**/api/getBoxAction**', async (route) => {
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

    // Mocking server action to handle the pending transaction and mint the NFT without calling decent
    await this.page.route(`**/u/${builder.username}`, async (route) => {
      const method = route.request().method();
      const body = route.request().postDataJSON()?.[0];

      if (method === 'POST' && body?.pendingTransactionId) {
        if (isSuccess) {
          await route.fulfill({
            status: 200,
            json: { success: true }
          });
        } else {
          await route.fulfill({
            status: 500,
            json: { success: false }
          });
        }
      } else {
        await route.continue();
      }
    });
  }
}
