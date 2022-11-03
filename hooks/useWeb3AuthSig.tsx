import { verifyMessage } from '@ethersproject/wallet';
import { useWeb3React } from '@web3-react/core';
import type { Signer } from 'ethers';
import { getAddress, toUtf8Bytes } from 'ethers/lib/utils';
import { SiweMessage } from 'lit-siwe';
import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import type { AuthSig } from 'lib/blockchain/interfaces';
import log from 'lib/log';
import { ExternalServiceError, InvalidInputError } from 'lib/utilities/errors';
import { lowerCaseEqual } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

import { Web3Connection } from '../components/_app/Web3ConnectionManager';

import { PREFIX, useLocalStorage } from './useLocalStorage';

type IContext = {
  account?: string | null;
  walletAuthSignature?: AuthSig | null;
  library: any;
  chainId: any;
  sign: () => Promise<AuthSig>;
  triedEager: boolean;
  getStoredSignature: (account: string) => AuthSig | null;
  disconnectWallet: () => void;
  // Used by useUser to pass the user to the Web3 context
  setLoggedInUser: (user: LoggedInUser | null) => void;
  // Which tool is providing the web3 connection ie. Metamas, WalletConnect, etc.
  connector: any;
  connectableWalletDetected: boolean;
  // Trigger workflow to connect a new wallet to current account
  connectNewWallet: () => void;
};

export const Web3Context = createContext<Readonly<IContext>>({
  account: null,
  walletAuthSignature: null,
  sign: () => Promise.resolve({} as AuthSig),
  triedEager: false,
  getStoredSignature: () => null,
  disconnectWallet: () => null,
  library: null,
  chainId: null,
  setLoggedInUser: (user: LoggedInUser | null) => null,
  connector: null,
  connectableWalletDetected: false,
  connectNewWallet: () => null
});

// a wrapper around account and library from web3react
export function Web3AccountProvider ({ children }: { children: ReactNode }) {

  const { account, library, chainId, connector } = useWeb3React();

  const { triedEager, openWalletSelectorModal } = useContext(Web3Connection);

  // We only expose this account if there is no active user, or the account is linked to the current user
  const [storedAccount, setStoredAccount] = useState<string | null>(null);

  const [isConnectableWallet, setIsConnectableWallet] = useState(false);

  const [, setLitAuthSignature] = useLocalStorage<AuthSig | null>('lit-auth-signature', null, true);
  const [, setLitProvider] = useLocalStorage<string | null>('lit-web3-provider', null, true);
  const [user, setLoggedInUser] = useState<LoggedInUser | null>(null);

  const [walletAuthSignature, setWalletAuthSignature] = useState<AuthSig | null>(null);

  function getStoredSignature (walletAddress: string) {
    const stored = window.localStorage.getItem(`${PREFIX}.wallet-auth-sig-${walletAddress}`);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthSig;
        return parsed;
      }
      catch (e) {
        log.error('Error parsing stored signature', e);
        return null;
      }
    }
    else {
      return null;
    }
  }

  const setCurrentUser = useCallback((updatedUser: LoggedInUser | null) => {
    setLoggedInUser(updatedUser);
  }, []);

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

      if (
        (user?.wallets.some(w => w.address === account)) || !user
      ) {
        setStoredAccount(account);

        const storedWalletSignature = getStoredSignature(account);
        setSignature(storedWalletSignature);

        setIsConnectableWallet(false);
      // Provide access to account since there is no current user
      }
      // Ignore the account if it is not linked to the current user
      else {
        setStoredAccount(null);

        charmClient.blockchain.isConnectableWallet(account)
          .then(({ connectable }) => setIsConnectableWallet(connectable))
          .catch(() => setIsConnectableWallet(false));
      }

    }
    else {
      setSignature(null);
      setStoredAccount(null);
    }
  }, [account, user]);

  async function sign (): Promise<AuthSig> {

    if (!account) {
      throw new ExternalServiceError('No account detected');
    }

    const signer = library.getSigner(account) as Signer;

    if (!signer) {
      throw new ExternalServiceError('Missing signer');
    }

    const signerChainId = await signer.getChainId();

    const preparedMessage = {
      domain: window.location.host,
      address: getAddress(account), // convert to EIP-55 format or else SIWE complains
      uri: globalThis.location.origin,
      version: '1',
      chainId: signerChainId
    };

    const message = new SiweMessage(preparedMessage);

    const body = message.prepareMessage();

    const messageBytes = toUtf8Bytes(body);

    const newSignature = await signer.signMessage(messageBytes);
    const signatureAddress = verifyMessage(body, newSignature).toLowerCase();

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

  function disconnectWallet () {
    if (account) {
      window.localStorage.removeItem(`${PREFIX}.wallet-auth-sig-${account}`);
      setWalletAuthSignature(null);
    }
  }

  function connectNewWallet () {
    if (!isConnectableWallet) {
      throw new InvalidInputError('The currently detected wallet is not connectable');
    }

    openWalletSelectorModal();
  }

  const value = useMemo(() => ({
    account: storedAccount,
    walletAuthSignature,
    triedEager,
    sign,
    getStoredSignature,
    disconnectWallet,
    library,
    chainId,
    setLoggedInUser: setCurrentUser,
    connector
  }) as IContext, [account, walletAuthSignature, triedEager, storedAccount]);

  // console.log('Current account', storedAccount);

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );

}

export const useWeb3AuthSig = () => useContext(Web3Context);
