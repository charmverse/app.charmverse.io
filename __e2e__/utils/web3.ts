import { readFileSync } from 'fs';

import type { Page as BrowserPage } from '@playwright/test';
import type { ethers as EthersType } from 'ethers';
import type { SiweMessage } from 'lit-siwe';

import type { AuthSig } from 'lib/blockchain/interfaces';
import { baseUrl } from 'testing/mockApiCall';

type MockOptions = {
  blockchain: 'ethereum';
  block?: number;
  provider?: any;
  accounts?: {
    delay?: number;
    return: string[]; // list of wallet addresses
  };
  network?: {
    add?: {
      chaindId: number;
      chainName: string;
      nativeCurrency: { name: string, symbol: string, decimals: number };
      rpcUrls: string[];
      blockExplorerUrls: string[];
      iconUrls: string[];
    };
    error?: () => { code: number };
    switchTo?: string;
  };
  request?: {
    to: string;
    api: any[];
    method: 'balanceOf';
    params: string;
    return: string;
  };
  signature?: {
    params: string[];
    return: string;
  };
  transaction?: {
    from: string;
    instructions: { to: string, api: any }[];
  };
}

type Web3Mock = {
  mock (props: MockOptions): void;
  trigger (event: 'connected' | 'accountsChanged', payload: any[]): void;
}

type InitParams<T> = {
  Web3Mock: Web3Mock;
  context: T;
}

// load web3 mock library https:// massimilianomirra.com/notes/mocking-window-ethereum-in-playwright-for-end-to-end-dapp-testing
export async function mockWeb3<T> ({ page, context, init }: { page: BrowserPage, context: T, init (params: InitParams<T>): void }) {

  await page.addInitScript({
    content:
      `${readFileSync(
        require.resolve('@depay/web3-mock/dist/umd/index.bundle.js'),
        'utf-8'
      )}\n`
      + `${readFileSync(
        require.resolve('ethers/dist/ethers.umd.js'),
        'utf-8'
      )}\n`
      + `

        Web3Mock.mock('ethereum');

        // mock deprecatd apis not handled by web3-mock
        window.ethereum.enable = () => Promise.resolve();

        window.ethereum.send = (method, opts) => {
          return window.ethereum.request({ method }, opts);
        };

      `
      + `(${init.toString()})({ ethers, Web3Mock, context: ${JSON.stringify(context)} });`
  });
}

export async function mockAuthSig ({ address, page }: { address: string, page: BrowserPage }): Promise<AuthSig> {

  await page.waitForURL(baseUrl);

  const authSig = {
    address,
    derivedVia: 'charmverse-mock',
    sig: 'signature',
    signedMessage: 'signed message'
  };

  // Approach to setting localstorage found here https://github.com/microsoft/playwright/issues/6258#issuecomment-824314544
  await page.evaluate(`window.localStorage.setItem('charm.v1.wallet-auth-sig-${address}', '${JSON.stringify(authSig)}')`);

  return authSig;
}
