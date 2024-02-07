import { log } from '@charmverse/core/log';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { Stack, Typography } from '@mui/material';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import * as http from 'adapters/http';
import { useCreateFarcasterSigner } from 'charmClient/hooks/farcaster';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { CanvasQRCode } from 'components/settings/account/components/otp/components/CanvasQrCode';
import { createHexKeyPair } from 'lib/farcaster/createHexKeyPair';
import type { FarcasterUser, SignedKeyRequest } from 'lib/farcaster/interfaces';

import { useLocalStorage } from './useLocalStorage';
import { useSnackbar } from './useSnackbar';

export const farcasterUserLocalStorageKey = 'farcasterUser';

export type FarcasterUserContext = {
  farcasterUser: FarcasterUser | null;
  isCreatingSigner: boolean;
  createAndStoreSigner: () => Promise<void>;
  logout: () => void;
  farcasterSignerModal: PopupState;
};

export const FarcasterUserContext = createContext<FarcasterUserContext>({
  farcasterUser: null,
  isCreatingSigner: false,
  createAndStoreSigner: async () => {},
  logout: () => {},
  farcasterSignerModal: {} as PopupState
});

function FarcasterApprovalModal({
  farcasterSignerModal,
  farcasterUser,
  setFarcasterUser,
  logout
}: {
  farcasterSignerModal: PopupState;
  farcasterUser: FarcasterUser;
  setFarcasterUser: (user: FarcasterUser) => void;
  logout: () => void;
}) {
  const warpcastClientDeeplink = farcasterUser?.signerApprovalUrl?.replace(
    'farcaster://',
    'https://client.warpcast.com/deeplinks/'
  );
  const { showMessage } = useSnackbar();

  useEffect(() => {
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
            return;
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
          //
        }
      }, 2500);
    };

    const handleVisibilityChange = () => {
      clearInterval(intervalId);
      if (!document.hidden) {
        startPolling();
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
  }, [farcasterUser, farcasterSignerModal]);

  return (
    <Modal
      open
      onClose={() => {
        farcasterSignerModal.close();
        logout();
      }}
      title='Approve in Warpcast'
    >
      <Typography>Please scan the QR code and approve the request in your Farcaster app</Typography>
      {warpcastClientDeeplink && (
        <Stack mt={2} gap={1} alignItems='center'>
          <CanvasQRCode uri={warpcastClientDeeplink} />
          <Link external href={warpcastClientDeeplink} target='_blank' rel='noreferrer'>
            <Stack flexDirection='row' gap={0.5} alignItems='center' justifyContent='center'>
              <PhoneIphoneIcon fontSize='small' sx={{ fill: (theme) => theme.palette.farcaster.main }} />
              <Typography
                sx={{
                  color: (theme) => theme.palette.farcaster.main
                }}
              >
                I'm using my phone
              </Typography>
              <ArrowRightAltIcon fontSize='small' sx={{ fill: (theme) => theme.palette.farcaster.main }} />
            </Stack>
          </Link>
        </Stack>
      )}
    </Modal>
  );
}

export function FarcasterUserProvider({ children }: { children: ReactNode }) {
  const [farcasterUser, setFarcasterUser] = useLocalStorage<FarcasterUser | null>(farcasterUserLocalStorageKey, null);
  const { showMessage } = useSnackbar();
  const farcasterSignerModal = usePopupState({
    variant: 'popover',
    popupId: 'farcaster-signer'
  });
  const [isCreatingSigner, setIsCreatingSigner] = useState(false);
  const { trigger: createFarcasterSigner } = useCreateFarcasterSigner();

  function logout() {
    setFarcasterUser(null);
  }

  async function createAndStoreSigner() {
    try {
      setIsCreatingSigner(true);
      const keypairString = await createHexKeyPair();
      const farcasterSigner = await createFarcasterSigner({
        publicKey: (keypairString.publicKey.startsWith('0x')
          ? keypairString.publicKey
          : `0x${keypairString.publicKey}`) as `0x${string}`
      });

      if (!farcasterSigner) {
        throw new Error('Error creating signer');
      }

      const { signature, requestFid, deadline } = farcasterSigner;

      const {
        result: { signedKeyRequest }
      } = await http.POST<{
        result: { signedKeyRequest: { token: string; deeplinkUrl: string } };
      }>(
        `https://api.warpcast.com/v2/signed-key-requests`,
        {
          key: keypairString.publicKey,
          signature,
          requestFid: BigInt(requestFid).toString(),
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
      farcasterSignerModal.open();
    } catch (error: any) {
      // err.shortMessage comes from viem
      showMessage(error.shortMessage || error.message || 'Something went wrong. Please try again', 'error');
      log.error('Error creating signer', {
        error
      });
    } finally {
      setIsCreatingSigner(false);
    }
  }

  const value = useMemo(
    () => ({
      farcasterUser,
      isCreatingSigner,
      createAndStoreSigner,
      logout,
      farcasterSignerModal
    }),
    [farcasterUser, isCreatingSigner, farcasterSignerModal]
  );

  return (
    <FarcasterUserContext.Provider value={value}>
      {children}
      {farcasterSignerModal.isOpen && farcasterUser && farcasterUser.status === 'pending_approval' && (
        <FarcasterApprovalModal
          farcasterSignerModal={farcasterSignerModal}
          farcasterUser={farcasterUser}
          setFarcasterUser={setFarcasterUser}
          logout={logout}
        />
      )}
    </FarcasterUserContext.Provider>
  );
}

export const useFarcasterUser = () => {
  const context = useContext(FarcasterUserContext);
  if (!context) {
    throw new Error('useFarcasterUser must be used within a FarcasterUserProvider');
  }
  return context;
};
