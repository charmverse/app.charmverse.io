import { log } from '@charmverse/core/log';
import type { UserWallet } from '@charmverse/core/prisma';
import { verifyMessage } from '@ethersproject/wallet';
import { useWeb3React } from '@web3-react/core';
import type { Signer } from 'ethers';
import { getAddress, toUtf8Bytes } from 'ethers/lib/utils';
import { SiweMessage } from 'lit-siwe';
import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { mutate } from 'swr';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { useWeb3ConnectionManager } from 'components/_app/Web3ConnectionManager/Web3ConnectionManager';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { SystemError } from 'lib/utilities/errors';
import { ExternalServiceError, MissingWeb3AccountError } from 'lib/utilities/errors';
import { lowerCaseEqual } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

import { PREFIX, useLocalStorage } from './useLocalStorage';
import { useUser } from './useUser';

type IContext = {
  // Web3 account belonging to the current logged in user
  account?: string | null;
  walletAuthSignature?: AuthSig | null;
  library: any;
  chainId: any;
  sign: () => Promise<AuthSig>;
  triedEager: boolean;
  getStoredSignature: (account: string) => AuthSig | null;
  logoutWallet: () => void;
  disconnectWallet: (address: UserWallet['address']) => Promise<void>;
  // Which tool is providing the web3 connection ie. Metamask∂, WalletConnect, etc.
  connector: any;
  // A wallet is currently connected and can be used to generate signatures. This is different from a user being connected
  verifiableWalletDetected: boolean;
  // Trigger workflow to connect a new wallet. In future, this can be used to support a situation where a browser has multiple wallets installed
  connectWallet: () => void;
  connectWalletModalIsOpen: boolean;
  isSigning: boolean;
  isConnectingIdentity: boolean;
  closeWalletSelector: () => void;
  resetSigning: () => void;
  loginFromWeb3Account: (authSig?: AuthSig) => Promise<LoggedInUser>;
  setAccountUpdatePaused: (paused: boolean) => void;
};

export const Web3Context = createContext<Readonly<IContext>>({
  account: null,
  walletAuthSignature: null,
  sign: () => Promise.resolve({} as AuthSig),
  triedEager: false,
  getStoredSignature: () => null,
  logoutWallet: () => null,
  disconnectWallet: async () => {},
  library: null,
  chainId: null,
  connector: null,
  verifiableWalletDetected: false,
  connectWallet: () => null,
  connectWalletModalIsOpen: false,
  isSigning: false,
  isConnectingIdentity: false,
  closeWalletSelector: () => null,
  resetSigning: () => null,
  loginFromWeb3Account: () => Promise.resolve(null as any),
  setAccountUpdatePaused: () => null
});

// a wrapper around account and library from web3react
export function Web3AccountProvider({ children }: { children: ReactNode }) {
  const { account, library, chainId, connector } = useWeb3React();

  const {
    triedEager,
    openWalletSelectorModal,
    closeWalletSelectorModal,
    isWalletSelectorModalOpen,
    isConnectingIdentity
  } = useWeb3ConnectionManager();
  const [isSigning, setIsSigning] = useState(false);
  const verifiableWalletDetected = !!account && !isConnectingIdentity;

  // We only expose this account if there is no active user, or the account is linked to the current user
  const [storedAccount, setStoredAccount] = useState<string | null>(null);

  const [, setLitAuthSignature] = useLocalStorage<AuthSig | null>('lit-auth-signature', null, true);
  const [, setLitProvider] = useLocalStorage<string | null>('lit-web3-provider', null, true);
  const { user, setUser, logoutUser } = useUser();

  const [walletAuthSignature, setWalletAuthSignature] = useState<AuthSig | null>(null);
  const [accountUpdatePaused, setAccountUpdatePaused] = useState(false);

  async function loginFromWeb3Account(authSig?: AuthSig) {
    if (!account) {
      throw new Error('No wallet address connected');
    }
    if (!verifiableWalletDetected && !authSig) {
      throw new MissingWeb3AccountError();
    }

    let signature = authSig ?? (account ? getStoredSignature(account) : null);

    if (!signature) {
      signature = await sign();
    }

    try {
      // Refresh the user account. This was required as otherwise the user would not be able to see the first page upon joining the space
      const refreshedProfile = await charmClient.login({ address: signature.address, walletSignature: signature });

      setSignature(account, signature, true);
      setUser(refreshedProfile);

      return refreshedProfile;
    } catch (err) {
      if ((err as SystemError)?.errorType === 'Disabled account') {
        throw err;
      }

      const newProfile = await charmClient.createUser({ address: signature.address, walletSignature: signature });
      setSignature(account, signature, true);
      setUser(newProfile);
      return newProfile;
    }
  }
  function setSignature(_account: string, signature: AuthSig | null, writeToLocalStorage?: boolean) {
    if (writeToLocalStorage) {
      window.localStorage.setItem(getStorageKey(_account), JSON.stringify(signature));
    }

    // Ensures Lit signature is always in sync
    setLitAuthSignature(signature);
    setLitProvider('metamask');
    setWalletAuthSignature(signature);
  }

  // Only expose account if current user and account match up
  useEffect(() => {
    const userOwnsAddress = user?.wallets.some((w) => lowerCaseEqual(w.address, account));
    // Case 1: user is connecting wallets
    if (isConnectingIdentity) {
      // Don't update new values
    }
    // Case 2: user is logged in and account is linked to user or user is adding a new wallet
    else if (account && (userOwnsAddress || accountUpdatePaused)) {
      setStoredAccount(account.toLowerCase());

      const storedWalletSignature = getStoredSignature(account);
      setSignature(account, storedWalletSignature);
    }
    // Case 3: user is switching wallets
    else if (
      account &&
      // storedAccount means they logged in with a different wallet previously
      storedAccount &&
      user &&
      // Only apply the following logic to users that have at least 1 wallet
      user?.wallets.length > 0 &&
      !userOwnsAddress
    ) {
      const storedSignature = getStoredSignature(account);
      if (storedSignature) {
        log.debug('Logging user in with previous wallet signature');
        loginFromWeb3Account(storedSignature).catch((e) => {
          setSignature(account, null);
          setStoredAccount(null);
          logoutUser();
        });
        // user is currently signed in to a different wallet, log them out
      } else {
        log.debug('Logging out user due to wallet switch');
        setSignature(account, null);
        setStoredAccount(null);
        logoutUser();
      }
    }
  }, [account, !!user, isConnectingIdentity, accountUpdatePaused]);

  async function sign(): Promise<AuthSig> {
    if (!account) {
      throw new MissingWeb3AccountError();
    }

    const signer = library.getSigner(account) as Signer;

    if (!signer) {
      throw new ExternalServiceError('Missing signer');
    }

    setIsSigning(true);

    try {
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

      setSignature(account, generated, true);
      setIsSigning(false);

      return generated;
    } catch (err) {
      setIsSigning(false);
      throw err;
    }
  }
  const logoutWallet = useCallback(() => {
    if (account) {
      window.localStorage.removeItem(getStorageKey(account));
      setWalletAuthSignature(null);
    }
  }, [account]);

  const { trigger: triggerDisconnectWallet, isMutating: isDisconnectingWallet } = useSWRMutation(
    '/profile/remove-wallet',
    (_url, { arg }: Readonly<{ arg: UserWallet['address'] }>) =>
      account && user ? charmClient.removeUserWallet({ address: arg }) : null,
    {
      async onSuccess(updatedUser) {
        logoutWallet();

        setLitAuthSignature(null);
        setLitProvider(null);
        setStoredAccount(null);
        setUser(updatedUser);
        connector?.deactivate();
        await mutate(`/nfts/${updatedUser?.id}`);
        await mutate(`/orgs/${updatedUser?.id}`);
        await mutate(`/poaps/${updatedUser?.id}`);
      }
    }
  );

  async function disconnectWallet(address: UserWallet['address']) {
    await triggerDisconnectWallet(address);
  }

  function connectWallet() {
    openWalletSelectorModal();
  }

  const value = useMemo<IContext>(
    () => ({
      account: storedAccount,
      walletAuthSignature,
      triedEager,
      sign,
      getStoredSignature,
      disconnectWallet,
      logoutWallet,
      library,
      chainId,
      connector,
      verifiableWalletDetected,
      connectWallet,
      connectWalletModalIsOpen: isWalletSelectorModalOpen,
      isSigning: isSigning || isDisconnectingWallet,
      isConnectingIdentity,
      closeWalletSelector: closeWalletSelectorModal,
      resetSigning: () => setIsSigning(false),
      loginFromWeb3Account,
      setAccountUpdatePaused
    }),
    [
      account,
      walletAuthSignature,
      triedEager,
      storedAccount,
      connector,
      isWalletSelectorModalOpen,
      isSigning,
      chainId,
      library,
      isConnectingIdentity,
      setAccountUpdatePaused
    ]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

function getStorageKey(address: string) {
  return `${PREFIX}.wallet-auth-sig-${getAddress(address)}`;
}

function getStoredSignatureString(address: string) {
  const value = window.localStorage.getItem(getStorageKey(address));
  if (value) {
    return value;
  }
  const oldKeyValue = window.localStorage.getItem(`${PREFIX}.wallet-auth-sig-${address}`);
  if (oldKeyValue) {
    log.warn('Found old wallet auth sig key');
  }
  return oldKeyValue;
}

function getStoredSignature(_account: string) {
  const stored = getStoredSignatureString(_account);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as AuthSig;
      return parsed;
    } catch (e) {
      log.error('Error parsing stored signature', e);
      return null;
    }
  } else {
    return null;
  }
}

export const useWeb3AuthSig = () => useContext(Web3Context);
