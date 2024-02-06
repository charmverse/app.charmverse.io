import { log } from '@charmverse/core/log';
import { SIGNED_KEY_REQUEST_TYPE, SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN } from '@farcaster/core';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAddress } from 'viem';
import { optimism } from 'viem/chains';
import { useAccount, useSignTypedData } from 'wagmi';

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
};

export const FarcasterUserContext = createContext<FarcasterUserContext>({
  farcasterUser: null,
  loading: false,
  startFarcasterSignerProcess: async () => {},
  logout: () => {}
});

const deadline = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 100; // 100 years

export function FarcasterUserProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [farcasterUser, setFarcasterUser] = useLocalStorage<FarcasterUser | null>(farcasterUserLocalStorageKey, null);
  const { farcasterProfile } = useFarcasterProfile();
  const [ongoingSignerProcess, setOngoingSignerProcess] = useState(false);
  const { showMessage } = useSnackbar();
  const { address: account } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  function logout() {
    setFarcasterUser(null);
  }

  useEffect(() => {
    if (farcasterUser && farcasterUser.status === 'pending_approval') {
      let intervalId: any;

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
    }
  }, [farcasterUser]);

  // Trick to auto trigger the signer process after the network switch
  useEffect(() => {
    if (ongoingSignerProcess) {
      createAndStoreSigner().finally(() => {
        setOngoingSignerProcess(false);
      });
    }
  }, [ongoingSignerProcess]);

  async function startFarcasterSignerProcess() {
    setLoading(true);
    try {
      await switchActiveNetwork(optimism.id);
      setOngoingSignerProcess(true);
    } catch (_) {
      //
    } finally {
      setLoading(false);
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
          deadline
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
      logout
    }),
    [farcasterUser, loading]
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
