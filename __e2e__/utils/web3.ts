import { readFileSync } from 'fs';

import { getChainById } from '@packages/connectors/chains';
import type { Page as BrowserPage } from '@playwright/test';
import { SiweMessage } from 'siwe';
import { createWalletClient, getAddress, http } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

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
      nativeCurrency: { name: string; symbol: string; decimals: number };
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
    instructions: { to: string; api: any }[];
  };
};

type Web3Mock = {
  mock(props: MockOptions): void;
  trigger(event: 'connected' | 'accountsChanged', payload: any[]): void;
};

type InitParams<T> = {
  Web3Mock: Web3Mock;
  context: T;
};

type MockWeb3Options<T> = {
  page: BrowserPage;
  context?: Partial<T>;
  init(params: InitParams<T>): void;
};

type MockContext = { address: string; chainId?: number; privateKey: string | false };

// load web3 mock library https:// massimilianomirra.com/notes/mocking-window-ethereum-in-playwright-for-end-to-end-dapp-testing
export async function mockWeb3<T extends MockContext>({ page, context, init }: MockWeb3Options<T>) {
  context ||= {} as T;

  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  context.address ||= account.address;
  context.privateKey ??= privateKey; // allow setting to false to skip signing

  const walletSig = await mockWalletSignature(context as MockContext);

  await page.addInitScript({
    content:
      `${readFileSync(require.resolve('@depay/web3-mock/dist/umd/index.bundle.js'), 'utf-8')}\n` +
      `${readFileSync(require.resolve('ethers/dist/ethers.umd.js'), 'utf-8')}\n` +
      `

        Web3Mock.mock('ethereum');

        // mock deprecatd apis not handled by web3-mock
        window.ethereum.enable = () => Promise.resolve();

        window.ethereum.send = (method, opts) => {
          return window.ethereum.request({ method }, opts);
        };

        ${
          walletSig
            ? `
          // mock wallet signature
          window.localStorage.setItem('charm.v1.wallet-auth-sig-${context.address}', '${walletSig}');
          // store wallet address to be used for connector mock
          window.localStorage.setItem('charm.v1.testWalletAddress', '${context.address}');
        `
            : ''
        }

      ` +
      `(${init.toString()})({ ethers, Web3Mock, context: ${JSON.stringify(context)} });`
  });
}

// mock the result of the wallet signature, this gets checked on login by the backend
export async function mockWalletSignature({ address, chainId = 1, privateKey }: MockContext) {
  if (privateKey === false) {
    return null;
  }

  const payload = generateSignaturePayload({ address, chainId, host: baseUrl });
  const message = new SiweMessage(payload);
  const prepared = message.prepareMessage();

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const chain = getChainById(chainId)?.viem;
  if (!chain) {
    return null;
  }
  const client = createWalletClient({
    account,
    chain,
    transport: http()
  });
  const signedMessage = await client.signMessage({ message: prepared });

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

function generateSignaturePayload({ address, chainId, host }: { address: string; chainId: number; host: string }) {
  const domain = host.match('https') ? host.split('https://')[1] : host.split('http://')[1];
  const uri = host;

  return {
    domain,
    address: getAddress(address), // convert to EIP-55 format or else SIWE complains
    uri,
    version: '1',
    chainId
  };
}
