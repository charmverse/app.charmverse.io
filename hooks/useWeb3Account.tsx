import { log } from '@charmverse/core/log';
import type { UserWallet } from '@charmverse/core/prisma';
import type { Web3Provider } from '@ethersproject/providers';
import { getWagmiConfig } from '@root/connectors/config';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { watchAccount } from '@wagmi/core';
import type { Signer } from 'ethers';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SiweMessage } from 'siwe';
import { mutate } from 'swr';
import { getAddress } from 'viem';

import { useCreateUser, useLogin, useRemoveWallet } from 'charmClient/hooks/profile';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import { useAccount, useConnect, useSignMessage } from 'hooks/wagmi';
import type {
  SignatureVerificationPayload,
  SignatureVerificationPayloadWithAddress
} from 'lib/blockchain/signAndVerify';
import type { SystemError } from 'lib/utils/errors';
import { MissingWeb3AccountError } from 'lib/utils/errors';
import { lowerCaseEqual } from 'lib/utils/strings';

import { useUser } from './useUser';
import { useVerifyLoginOtp } from './useVerifyLoginOtp';

type IContext = {
  // Web3 account belonging to the current logged in user
  account?: string | null;
  chainId: any;
  requestSignature: () => Promise<SignatureVerificationPayloadWithAddress>;
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
  const { address: account, chain, connector: activeConnector, isConnecting } = useAccount();
  const { open: openVerifyOtpModal, isOpen: isVerifyOtpModalOpen, close: closeVerifyOtpModal } = useVerifyLoginOtp();
  const router = useRouter();
  const chainId = chain?.id;
  const { signMessageAsync } = useSignMessage();

  const [isSigning, setIsSigning] = useState(false);
  const verifiableWalletDetected = !!account;

  // We only expose this account if there is no active user, or the account is linked to the current user
  const [storedAccount, setStoredAccount] = useState<string | null>(null);

  const { user, updateUser } = useUser();
  const { trigger: login } = useLogin();
  const { trigger: createUser } = useCreateUser();

  const { connectors, connectAsync } = useConnect();

  const [accountUpdatePaused, setAccountUpdatePaused] = useState(false);
  const { signer, provider } = useWeb3Signer({ chainId });

  const requestSignature = useCallback(async () => {
    if (!account) {
      throw new MissingWeb3AccountError();
    }

    setIsSigning(true);

    try {
      const preparedMessage: Partial<SiweMessage> = {
        domain: window.location.host,
        address: getAddress(account), // convert to EIP-55 format or else SIWE complains
        uri: globalThis.location.origin,
        version: '1',
        chainId: chainId || 1
      };

      const message = new SiweMessage(preparedMessage);
      const body = message.prepareMessage();
      const signature = await signMessageAsync({
        message: body
      });

      setIsSigning(false);

      return { message, signature, address: account } as SignatureVerificationPayloadWithAddress;
    } catch (err) {
      setIsSigning(false);
      throw err;
    }
    // activeConnector is not directly referenced, but is important so that WalletConnect issues a request on the correct chain
  }, [account, chainId, activeConnector, signMessageAsync]);

  const loginFromWeb3Account = useCallback(
    async (siwePayload?: SignatureVerificationPayload) => {
      if (!account) {
        throw new Error('No wallet address connected');
      }
      const payload = siwePayload || (await requestSignature());

      try {
        const resp = await login(
          { ...payload, address: account },
          {
            onSuccess: async (_resp) => {
              if ('id' in _resp) {
                // User is returned
                updateUser(_resp);
              } else {
                // Open the otp modal for verification
                openVerifyOtpModal();
              }
            }
          }
        );

        return resp && 'id' in resp ? resp : undefined;
      } catch (err) {
        if ((err as SystemError)?.errorType === 'Disabled account') {
          throw err;
        }

        const newProfile = await createUser({ ...payload, address: account });

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
  }, [account, isConnecting, accountUpdatePaused, !!user, storedAccount]);

  useEffect(() => {
    // This runs every time the wallet account changes.
    const unwatch = watchAccount(getWagmiConfig(), {
      onChange(_account) {
        if (isVerifyOtpModalOpen) {
          closeVerifyOtpModal();
        }
      }
    });

    return () => {
      unwatch();
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
          if (injectedConnector) {
            connectAsync({ connector: injectedConnector });
          }
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
