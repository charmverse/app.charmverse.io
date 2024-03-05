import { log } from '@charmverse/core/log';
import type { UserWallet } from '@charmverse/core/prisma';
import type { Web3Provider } from '@ethersproject/providers';
import type { Signer } from 'ethers';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SiweMessage } from 'siwe';
import { mutate } from 'swr';
import { getAddress } from 'viem';
import type { ConnectorData } from 'wagmi';
import { useAccount, useConnect, useNetwork, useSignMessage } from 'wagmi';

import { useCreateUser, useLogin, useRemoveWallet } from 'charmClient/hooks/profile';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import type { SignatureVerificationPayload } from 'lib/blockchain/signAndVerify';
import type { SystemError } from 'lib/utils/errors';
import { MissingWeb3AccountError } from 'lib/utils/errors';
import { lowerCaseEqual } from 'lib/utils/strings';
import type { LoggedInUser } from 'models';

import { useUser } from './useUser';
import { useVerifyLoginOtp } from './useVerifyLoginOtp';

type IContext = {
  // Web3 account belonging to the current logged in user
  account?: string | null;
  chainId: any;
  requestSignature: () => Promise<SignatureVerificationPayload>;
  disconnectWallet: (address: UserWallet['address']) => Promise<void>;
  // A wallet is currently connected and can be used to generate signatures. This is different from a user being connected
  verifiableWalletDetected: boolean;
  isSigning: boolean;
  resetSigning: () => void;
  loginFromWeb3Account: (payload?: SignatureVerificationPayload) => Promise<LoggedInUser | undefined>;
  setAccountUpdatePaused: (paused: boolean) => void;
  signer: Signer | undefined;
  provider: Web3Provider | undefined;
};

export const Web3Context = createContext<Readonly<IContext>>({
  account: null,
  requestSignature: async () => Promise.resolve({} as any),
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
  const { address: account, connector: activeConnector, isConnecting } = useAccount();
  const { open: openVerifyOtpModal, isOpen: isVerifyOtpModalOpen, close: closeVerifyOtpModal } = useVerifyLoginOtp();
  const router = useRouter();
  const { chain } = useNetwork();
  const chainId = chain?.id;
  const { signMessageAsync } = useSignMessage();

  const [isSigning, setIsSigning] = useState(false);
  const verifiableWalletDetected = !!account;

  // We only expose this account if there is no active user, or the account is linked to the current user
  const [storedAccount, setStoredAccount] = useState<string | null>(null);

  const { user, updateUser, logoutUser } = useUser();
  const { trigger: login } = useLogin();
  const { trigger: createUser } = useCreateUser();

  const { connectors, connectAsync } = useConnect();

  const [accountUpdatePaused, setAccountUpdatePaused] = useState(false);
  const { signer, provider } = useWeb3Signer({ chainId });

  const requestSignature = useCallback(async () => {
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
      const signature = await signMessageAsync({
        message: body
      });

      setIsSigning(false);

      return { message, signature };
    } catch (err) {
      setIsSigning(false);
      throw err;
    }
  }, [account, chainId, signMessageAsync]);

  const loginFromWeb3Account = useCallback(
    async (siwePayload?: SignatureVerificationPayload) => {
      if (!account) {
        throw new Error('No wallet address connected');
      }
      const payload = siwePayload || (await requestSignature());

      try {
        const resp = await login(payload, {
          onSuccess: async (_resp) => {
            if ('id' in _resp) {
              // User is returned
              updateUser(_resp);
            } else {
              // Open the otp modal for verification
              openVerifyOtpModal();
            }
          }
        });

        return resp && 'id' in resp ? resp : undefined;
      } catch (err) {
        if ((err as SystemError)?.errorType === 'Disabled account') {
          throw err;
        }

        const newProfile = await createUser(payload);

        if (newProfile) {
          updateUser(newProfile);
        }
        return newProfile;
      }
    },
    [account, router]
  );

  // Only expose account if current user and account match up
  useEffect(() => {
    const userOwnsAddress = user?.wallets.some((w) => lowerCaseEqual(w.address, account));
    // Case 1: user is connecting wallets
    if (isConnecting) {
      // Don't update new values
    }
    // Case 2: user is logged in and account is linked to user or user is adding a new wallet
    else if (account && (userOwnsAddress || accountUpdatePaused)) {
      setStoredAccount(account.toLowerCase());
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
      log.debug('Logging out user due to wallet switch');
      setStoredAccount(null);
      logoutUser();
    }
  }, [account, isConnecting, accountUpdatePaused, !!user, storedAccount]);

  useEffect(() => {
    const handleConnectorUpdate = ({ account: _acc }: ConnectorData) => {
      // This runs every time the wallet account changes.
      if (_acc) {
        if (isVerifyOtpModalOpen) {
          closeVerifyOtpModal();
        }
      }
    };

    activeConnector?.on('change', handleConnectorUpdate);

    return () => {
      activeConnector?.off('change', handleConnectorUpdate);
    };
  }, []);

  const { trigger: triggerDisconnectWallet, isMutating: isDisconnectingWallet } = useRemoveWallet();

  const disconnectWallet = useCallback(
    async (address: string) => {
      await triggerDisconnectWallet(
        { address },
        {
          onSuccess: async (updatedUser) => {
            setStoredAccount(null);
            updateUser(updatedUser);
            activeConnector?.disconnect();
            await mutate((key) => typeof key === 'string' && key.startsWith(`/nfts/${updatedUser?.id}`));
            await mutate((key) => typeof key === 'string' && key.startsWith(`/orgs/${updatedUser?.id}`));
            await mutate((key) => typeof key === 'string' && key.startsWith(`/poaps/${updatedUser?.id}`));
          }
        }
      );
    },
    [triggerDisconnectWallet]
  );

  // This is a patch for Metamask connector. If entering the site with a locked wallet, further changes are not detected
  // This method will detect changes in the account and reconnect the wallet to our wagmi stack
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum?.on && user?.wallets) {
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
  }, [user?.wallets, connectors, account]);

  const value = useMemo<IContext>(
    () => ({
      account: storedAccount,
      requestSignature,
      disconnectWallet,
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
      storedAccount,
      isSigning,
      isDisconnectingWallet,
      verifiableWalletDetected,
      requestSignature,
      setAccountUpdatePaused,
      disconnectWallet,
      loginFromWeb3Account,
      signer,
      provider
    ]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export const useWeb3Account = () => useContext(Web3Context);
