import { verifyMessage } from '@ethersproject/wallet';
import { useWeb3React } from '@web3-react/core';
import { getAddress, toUtf8Bytes } from 'ethers/lib/utils';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { SiweMessage } from 'lit-siwe';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { box } from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { lowerCaseEqual } from 'lib/utilities/strings';
import { ExternalServiceError } from '../lib/utilities/errors';
import { PREFIX, useLocalStorage } from './useLocalStorage';
import { Web3Connection } from '../components/_app/Web3ConnectionManager';

type IContext = {
  account?: string | null;
  walletAuthSignature?: AuthSig | null;
  sign: () => Promise<AuthSig>;
  triedEager: boolean;
  getStoredSignature: (account: string) => AuthSig | null;
};

export const Web3Context = createContext<Readonly<IContext>>({
  account: null,
  walletAuthSignature: null,
  sign: () => Promise.resolve({} as AuthSig),
  triedEager: false,
  getStoredSignature: () => null
});

// a wrapper around account and library from web3react
export function Web3AccountProvider ({ children }: { children: ReactNode }) {

  const { account, library } = useWeb3React();
  const { triedEager } = useContext(Web3Connection);

  const [, setLitAuthSignature] = useLocalStorage<AuthSig | null>('lit-auth-signature', null, true);
  const [, setLitProvider] = useLocalStorage<string | null>('lit-web3-provider', null, true);

  const [walletAuthSignature, setWalletAuthSignature] = useState<AuthSig | null>(null);

  /**
   * Retrieve signature from localstorage for a specific wallet address
   * @param account
   * @returns
   */
  function getStoredSignature (walletAddress: string) {
    const stored = window.localStorage.getItem(`${PREFIX}.wallet-auth-sig-${walletAddress}`);

    if (stored) {
      return JSON.parse(stored) as AuthSig;
    }
    else {
      return null;

    }

  }

  function setSignature (signature: AuthSig | null, writeToLocalStorage?: boolean) {

    if (writeToLocalStorage) {
      window.localStorage.setItem(`${PREFIX}.wallet-auth-sig-${account}`, JSON.stringify(signature));
    }

    // Ensures Lit signature is always in sync
    setLitAuthSignature(signature);
    setLitProvider('metamask');
    setWalletAuthSignature(signature);

  }

  // External
  // Inform the user that we have an account but not auth signature

  useEffect(() => {
    //  Automagic lit signature update only

    if (account) {

      try {
        const storedWalletSignature = JSON.parse(window.localStorage.getItem(`${PREFIX}.wallet-auth-sig-${account}`) as string) as AuthSig;
        setSignature(storedWalletSignature);
      }
      catch (err) {
        setSignature(null);
      }
    }
    else {
      setSignature(null);
    }
  }, [account]);

  async function sign (): Promise<AuthSig> {

    if (!account) {
      throw new ExternalServiceError('No account detected');
    }

    const signer = library.getSigner(account);

    if (!signer) {
      throw new ExternalServiceError('Missing signer');
    }

    const chainId = await signer?.getChainId();

    const preparedMessage = {
      domain: window.location.host,
      address: getAddress(account as string), // convert to EIP-55 format or else SIWE complains
      uri: globalThis.location.origin,
      version: '1',
      chainId
    };

    const message = new SiweMessage(preparedMessage);

    const body = message.prepareMessage();

    const messageBytes = toUtf8Bytes(body);

    const newSignature = await signer.signMessage(messageBytes);

    const signatureAddress = verifyMessage(body, newSignature as string).toLowerCase();

    if (!lowerCaseEqual(signatureAddress, account)) {
      throw new Error('Signature address does not match account');
    }

    const generated: AuthSig = {
      sig: newSignature,
      derivedVia: 'charmverse.sign',
      signedMessage: body,
      address: signatureAddress
    };

    setSignature(generated, true);

    return generated;
  }

  const value = useMemo(() => ({
    account, walletAuthSignature, triedEager, sign, getStoredSignature
  }) as IContext, [account, walletAuthSignature, triedEager]);

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );

}

export const useWeb3AuthSig = () => useContext(Web3Context);
