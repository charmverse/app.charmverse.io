import { log } from '@charmverse/core/log';
import type { UserWallet } from '@charmverse/core/prisma';
import type { Web3Provider } from '@ethersproject/providers';
import type { Signer } from 'ethers';
import { SiweMessage } from 'lit-siwe';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { mutate } from 'swr';
import useSWRMutation from 'swr/mutation';
import { recoverMessageAddress, getAddress } from 'viem';
import { useAccount, useConnect, useNetwork, useSignMessage } from 'wagmi';

import charmClient from 'charmClient';
import { useWeb3ConnectionManager } from 'components/_app/Web3ConnectionManager/Web3ConnectionManager';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { SystemError } from 'lib/utilities/errors';
import { MissingWeb3AccountError } from 'lib/utilities/errors';
import { lowerCaseEqual } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

import { PREFIX, useLocalStorage } from './useLocalStorage';
import { useUser } from './useUser';

type IContext = {
  // Web3 account belonging to the current logged in user
  account?: string | null;
  walletAuthSignature?: AuthSig | null;
  chainId: any;
  requestSignature: () => Promise<AuthSig>;
  getStoredSignature: (account: string) => AuthSig | null;
  logoutWallet: () => void;
  disconnectWallet: (address: UserWallet['address']) => Promise<void>;
  // A wallet is currently connected and can be used to generate signatures. This is different from a user being connected
  verifiableWalletDetected: boolean;
  isSigning: boolean;
  resetSigning: () => void;
  loginFromWeb3Account: (authSig?: AuthSig) => Promise<LoggedInUser | undefined>;
  setAccountUpdatePaused: (paused: boolean) => void;
  signer: Signer | undefined;
  provider: Web3Provider | undefined;
};

export const Web3Context = createContext<Readonly<IContext>>({
  account: null,
  walletAuthSignature: null,
  requestSignature: () => Promise.resolve({} as AuthSig),
  getStoredSignature: () => null,
  logoutWallet: () => null,
  disconnectWallet: async () => {},
  chainId: null,
  verifiableWalletDetected: false,
  isSigning: false,
  resetSigning: () => null,
  loginFromWeb3Account: () => Promise.resolve(null as any),
  setAccountUpdatePaused: () => null,
  signer: undefined,
  provider: undefined
});

// a wrapper around account and library from web3react
export function Web3AccountProvider({ children }: { children: ReactNode }) {
  const { address: account, connector: activeConnector } = useAccount();
  const router = useRouter();
  const { chain } = useNetwork();
  const chainId = chain?.id;
  const { signMessageAsync } = useSignMessage();

  const { isConnectingIdentity } = useWeb3ConnectionManager();
  const [isSigning, setIsSigning] = useState(false);
  const verifiableWalletDetected = !!account && !isConnectingIdentity;

  // We only expose this account if there is no active user, or the account is linked to the current user
  const [storedAccount, setStoredAccount] = useState<string | null>(null);

  const [, setLitAuthSignature] = useLocalStorage<AuthSig | null>('lit-auth-signature', null, true);
  const [, setLitProvider] = useLocalStorage<string | null>('lit-web3-provider', null, true);
  const { user, setUser, logoutUser } = useUser();

  const { connectors, connectAsync } = useConnect();

  const [walletAuthSignature, setWalletAuthSignature] = useState<AuthSig | null>(null);
  const [accountUpdatePaused, setAccountUpdatePaused] = useState(false);
  const { signer, provider } = useWeb3Signer({ chainId });

  const setSignature = useCallback(
    (_account: string, signature: AuthSig | null, writeToLocalStorage?: boolean) => {
      if (writeToLocalStorage) {
        window.localStorage.setItem(getStorageKey(_account), JSON.stringify(signature));
      }

      // Ensures Lit signature is always in sync
      setLitAuthSignature(signature);
      setLitProvider('metamask');
      setWalletAuthSignature(signature);
    },
    [setLitAuthSignature, setLitProvider]
  );

  const requestSignature = useCallback(async (): Promise<AuthSig> => {
    if (!account || !chainId) {
      throw new MissingWeb3AccountError();
    }

    setIsSigning(true);

    try {
      const preparedMessage = {
        domain: window.location.host,
        address: getAddress(account), // convert to EIP-55 format or else SIWE complains
        uri: globalThis.location.origin,
        version: '1',
        chainId
      };

      const message = new SiweMessage(preparedMessage);
      const body = message.prepareMessage();

      const newSignature = await signMessageAsync({
        message: body
      });
      const signatureAddress = await recoverMessageAddress({ message: body, signature: newSignature });

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
  }, [account, chainId, setSignature, signMessageAsync]);

  const loginFromWeb3Account = useCallback(
    async (authSig?: AuthSig) => {
      if (!account) {
        throw new Error('No wallet address connected');
      }
      if (!verifiableWalletDetected && !authSig) {
        throw new MissingWeb3AccountError();
      }

      let signature = authSig ?? (account ? getStoredSignature(account) : null);

      if (!signature) {
        signature = await requestSignature();
      }

      setSignature(account, signature, true);

      try {
        // Refresh the user account. This was required as otherwise the user would not be able to see the first page upon joining the space
        const resp = await charmClient.login({ address: signature.address, walletSignature: signature });

        if ('id' in resp) {
          // User is returned
          setUser(resp);
        } else {
          // User needs to authenticate through 2fa
          router.push('/authenticate/otp');
          return;
        }

        return resp;
      } catch (err) {
        if ((err as SystemError)?.errorType === 'Disabled account') {
          throw err;
        }

        const newProfile = await charmClient.createUser({ address: signature.address, walletSignature: signature });
        setSignature(account, signature, true);
        setUser(newProfile);
        return newProfile;
      }
    },
    [account, setSignature, setUser, requestSignature, router, verifiableWalletDetected]
  );

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
  }, [
    account,
    isConnectingIdentity,
    accountUpdatePaused,
    user,
    storedAccount,
    setSignature,
    loginFromWeb3Account,
    logoutUser
  ]);

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
        activeConnector?.disconnect();
        await mutate(`/nfts/${updatedUser?.id}`);
        await mutate(`/orgs/${updatedUser?.id}`);
        await mutate(`/poaps/${updatedUser?.id}`);
      }
    }
  );

  const disconnectWallet = useCallback(
    async (address: string) => {
      await triggerDisconnectWallet(address);
    },
    [triggerDisconnectWallet]
  );

  // This is a patch for Metamask connector. If entering the site with a locked wallet, further changes are not detected
  // This method will detect changes in the account and reconnect the wallet to our wagmi stack
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum?.on && user) {
      const handleAccountsChanged = (accounts: string[]) => {
        const changedAccount = accounts[0];
        if (
          changedAccount &&
          !account &&
          user.wallets.some((w) => lowerCaseEqual(w.address, changedAccount)) &&
          window.ethereum?.isMetaMask
        ) {
          const injectedConnector = connectors.find((c) => c.id === 'injected');
          connectAsync({ connector: injectedConnector });
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [user?.wallets, connectors]);

  const value = useMemo<IContext>(
    () => ({
      account: storedAccount,
      walletAuthSignature,
      requestSignature,
      getStoredSignature,
      disconnectWallet,
      logoutWallet,
      chainId,
      verifiableWalletDetected,
      isSigning: isSigning || isDisconnectingWallet,
      resetSigning: () => setIsSigning(false),
      loginFromWeb3Account,
      setAccountUpdatePaused,
      signer,
      provider
    }),
    [
      chainId,
      walletAuthSignature,
      storedAccount,
      isSigning,
      setAccountUpdatePaused,
      disconnectWallet,
      isDisconnectingWallet,
      loginFromWeb3Account,
      logoutWallet,
      requestSignature,
      verifiableWalletDetected,
      signer,
      provider
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

export const useWeb3Account = () => useContext(Web3Context);
