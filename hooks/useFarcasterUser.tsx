import { log } from '@charmverse/core/log';
import { SIGNED_KEY_REQUEST_TYPE, SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN } from '@farcaster/core';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAddress } from 'viem';
import { optimism } from 'viem/chains';
import { useAccount, useChainId, useSignTypedData } from 'wagmi';

import * as http from 'adapters/http';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { createHexKeyPair } from 'lib/farcaster/createHexKeyPair';
import type { FarcasterUser, SignedKeyRequest } from 'lib/farcaster/interfaces';

import { useFarcasterProfile } from './useFarcasterProfile';
import { useLocalStorage } from './useLocalStorage';
import { useSnackbar } from './useSnackbar';

export const farcasterUserLocalStorageKey = 'farcasterUser';

export type FarcasterUserContext = {
  farcasterUser: FarcasterUser | null;
  loading: boolean;
  startFarcasterSignerProcess: () => Promise<void>;
  logout: () => void;
  farcasterSignerModal: PopupState;
};

export const FarcasterUserContext = createContext<FarcasterUserContext>({
  farcasterUser: null,
  loading: false,
  startFarcasterSignerProcess: async () => {},
  logout: () => {},
  farcasterSignerModal: {} as PopupState
});

const deadline = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 100; // 100 years

export function FarcasterUserProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const chainId = useChainId();
  const [farcasterUser, setFarcasterUser] = useLocalStorage<FarcasterUser | null>(farcasterUserLocalStorageKey, null);
  const { farcasterProfile } = useFarcasterProfile();
  const [ongoingSignerProcess, setOngoingSignerProcess] = useState(false);
  const { showMessage } = useSnackbar();
  const { address: account } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const farcasterSignerModal = usePopupState({
    variant: 'popover',
    popupId: 'farcaster-signer'
  });

  function logout() {
    setFarcasterUser(null);
  }

  useEffect(() => {
    let intervalId: any;

    if (farcasterUser && farcasterUser.status === 'pending_approval' && farcasterSignerModal.isOpen) {
      const startPolling = () => {
        intervalId = setInterval(async () => {
          try {
            const fcSignerRequestResponse = await http.GET<{
              result: { signedKeyRequest: SignedKeyRequest };
            }>(
              `https://api.warpcast.com/v2/signed-key-request?token=${farcasterUser.token}`,
              {},
              {
                credentials: 'omit'
              }
            );
            if (fcSignerRequestResponse.result.signedKeyRequest.state !== 'completed') {
              throw new Error('Signer request not completed');
            }
            const user = {
              ...farcasterUser,
              ...fcSignerRequestResponse.result,
              fid: fcSignerRequestResponse.result.signedKeyRequest.userFid,
              status: 'approved' as const
            };
            setFarcasterUser(user);
            farcasterSignerModal.close();
            showMessage('Successfully logged in with Farcaster', 'success');
            clearInterval(intervalId);
          } catch (error) {
            log.error('Error polling for signer approval', {
              error
            });
          }
        }, 2500);
      };

      const stopPolling = () => {
        clearInterval(intervalId);
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopPolling();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Start the polling when the effect runs.
      startPolling();

      // Cleanup function to remove the event listener and clear interval.
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(intervalId);
      };
    } else if (intervalId) {
      clearInterval(intervalId);
    }
  }, [farcasterUser, farcasterSignerModal]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (ongoingSignerProcess && chainId === optimism.id) {
      timerId = setTimeout(() => {
        createAndStoreSigner().finally(() => {
          setOngoingSignerProcess(false);
          setLoading(false);
          farcasterSignerModal.open();
        });
      }, 250);
    }

    // Clean up the timer
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [ongoingSignerProcess, chainId]);

  async function startFarcasterSignerProcess() {
    setLoading(true);
    try {
      await switchActiveNetwork(optimism.id);
      setOngoingSignerProcess(true);
    } catch (_) {
      //
    }
  }

  async function createAndStoreSigner() {
    if (!farcasterProfile || !account) {
      return;
    }

    try {
      const keypairString = await createHexKeyPair();
      const fid = farcasterProfile.body.id;
      const signature = await signTypedDataAsync({
        account: getAddress(account),
        message: {
          requestFid: BigInt(fid),
          key: (keypairString.publicKey.startsWith('0x')
            ? keypairString.publicKey
            : `0x${keypairString.publicKey}`) as `0x${string}`,
          deadline: BigInt(deadline)
        },
        primaryType: 'SignedKeyRequest',
        domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
        types: {
          SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE
        }
      });

      const {
        result: { signedKeyRequest }
      } = await http.POST<{
        result: { signedKeyRequest: { token: string; deeplinkUrl: string } };
      }>(
        `https://api.warpcast.com/v2/signed-key-requests`,
        {
          key: keypairString.publicKey,
          signature,
          requestFid: BigInt(fid).toString(),
          deadline: BigInt(deadline).toString()
        },
        {
          credentials: 'omit'
        }
      );

      const user: FarcasterUser = {
        signature,
        publicKey: keypairString.publicKey,
        deadline,
        token: signedKeyRequest.token,
        signerApprovalUrl: signedKeyRequest.deeplinkUrl,
        privateKey: keypairString.privateKey,
        status: 'pending_approval'
      };
      setFarcasterUser(user);
    } catch (error: any) {
      showMessage(error.message || 'Something went wrong. Please try again', 'error');
      log.error('Error creating signer', {
        error
      });
    }
  }

  const value = useMemo(
    () => ({
      farcasterUser,
      loading,
      startFarcasterSignerProcess,
      logout,
      farcasterSignerModal
    }),
    [farcasterUser, loading, farcasterSignerModal]
  );

  return <FarcasterUserContext.Provider value={value}>{children}</FarcasterUserContext.Provider>;
}

export const useFarcasterUser = () => {
  const context = useContext(FarcasterUserContext);
  if (!context) {
    throw new Error('useFarcasterUser must be used within a FarcasterUserProvider');
  }
  return context;
};
