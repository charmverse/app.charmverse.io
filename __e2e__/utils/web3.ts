import { readFileSync } from 'fs';

import type { Page as BrowserPage } from '@playwright/test';
import { Wallet } from 'ethers';
import { SiweMessage } from 'lit-siwe';

import { generateSignaturePayload } from 'lib/blockchain/signAndVerify';
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

type MockWeb3Options<T> = {
  page: BrowserPage;
  context?: Partial<T>;
  init (params: InitParams<T>): void;
}

type MockContext = { address: string, chainId?: number, privateKey: string | false };

// load web3 mock library https:// massimilianomirra.com/notes/mocking-window-ethereum-in-playwright-for-end-to-end-dapp-testing
export async function mockWeb3<T extends MockContext> ({ page, context, init }: MockWeb3Options<T>) {

  const wallet = Wallet.createRandom();
  context ||= {} as T;
  context.address ||= wallet.address;
  context.privateKey ??= wallet.privateKey; // allow setting to false to skip signing

  const walletSig = await mockWalletSignature(context as MockContext);

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

        ${walletSig ? `
          // mock wallet signature
          window.localStorage.setItem('charm.v1.wallet-auth-sig-${context.address}', '${walletSig}');
        ` : ''}

      `
      + `(${init.toString()})({ ethers, Web3Mock, context: ${JSON.stringify(context)} });`
  });
}

// mock the result of the wallet signature, this gets checked on login by the backend
async function mockWalletSignature ({ address, chainId = 1, privateKey }: MockContext) {

  if (privateKey === false) {
    return null;
  }

  const payload = generateSignaturePayload({ address, chainId, host: baseUrl });
  const message = new SiweMessage(payload);
  const prepared = message.prepareMessage();

  // sign message
  const etherswallet = new Wallet(privateKey);

  const signedMessage = await etherswallet.signMessage(prepared);

  const authSig = {
    address,
    derivedVia: 'charmverse-mock',
    sig: signedMessage,
    signedMessage: prepared
  };

  // \n characters are not parseable by default
  const sanitizedString = JSON.stringify(authSig).replace(/\\n/g, '\\\\n');

  return sanitizedString;
}
