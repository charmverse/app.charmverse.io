import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { Stack, Typography } from '@mui/material';
import * as http from '@packages/adapters/http';
import { log } from '@packages/core/log';
import type { FarcasterProfile } from '@packages/farcaster/getFarcasterProfile';
import { getFarcasterProfile } from '@packages/farcaster/getFarcasterProfile';
import type { FarcasterUser, SignedKeyRequest } from '@packages/lib/farcaster/interfaces';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { useCreateFarcasterSigner } from 'charmClient/hooks/farcaster';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { CanvasQRCode } from 'components/settings/account/components/otp/components/CanvasQrCode';

import { useLocalStorage } from './useLocalStorage';
import { useSnackbar } from './useSnackbar';
import { useUser } from './useUser';

export const farcasterUserLocalStorageKey = 'farcasterUser';

export type FarcasterUserContext = {
  farcasterUser: FarcasterUser | null;
  isCreatingSigner: boolean;
  createAndStoreSigner: () => Promise<void>;
  logout: () => void;
  signerApprovalModalPopupState: PopupState;
  farcasterProfile: (FarcasterProfile['body'] & { connectedAddresses: string[] }) | null;
};

export const FarcasterUserContext = createContext<FarcasterUserContext>({
  farcasterUser: null,
  isCreatingSigner: false,
  createAndStoreSigner: async () => {},
  logout: () => {},
  signerApprovalModalPopupState: {} as PopupState,
  farcasterProfile: null
});

function FarcasterSignerApprovalModal({
  signerApprovalModalPopupState,
  farcasterUser,
  setFarcasterUser,
  logout
}: {
  signerApprovalModalPopupState: PopupState;
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

          const user: FarcasterUser = {
            ...farcasterUser,
            fid: fcSignerRequestResponse.result.signedKeyRequest.userFid,
            status: 'approved' as const
          };
          setFarcasterUser(user);
          signerApprovalModalPopupState.close();
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
  }, [farcasterUser, signerApprovalModalPopupState]);

  return (
    <Modal
      open
      onClose={() => {
        signerApprovalModalPopupState.close();
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
  const [isCreatingSigner, setIsCreatingSigner] = useState(false);
  const { user } = useUser();
  const { data: farcasterProfile } = useSWR(
    (user && user.wallets.length !== 0) || farcasterUser
      ? `farcaster/wallets=${user?.wallets[0]?.address}&fid=${farcasterUser?.fid}`
      : null,
    () =>
      getFarcasterProfile({
        wallets: user?.wallets?.map((wallet) => wallet.address),
        fid: farcasterUser?.fid
      })
  );

  const { trigger: createFarcasterSigner } = useCreateFarcasterSigner();
  const signerApprovalModalPopupState = usePopupState({
    variant: 'popover',
    popupId: 'farcaster-signer'
  });

  function logout() {
    setFarcasterUser(null);
  }

  async function createAndStoreSigner() {
    try {
      setIsCreatingSigner(true);
      const farcasterSigner = await createFarcasterSigner();

      if (!farcasterSigner) {
        throw new Error('Error creating signer');
      }

      const { signature, deeplinkUrl, token, deadline, privateKey, publicKey } = farcasterSigner;

      setFarcasterUser({
        publicKey,
        privateKey,
        status: 'pending_approval',
        deadline,
        signature,
        token,
        signerApprovalUrl: deeplinkUrl
      });
      signerApprovalModalPopupState.open();
    } catch (error: any) {
      // err.shortMessage comes from viem
      showMessage(error.shortMessage || error.message || 'Something went wrong. Please try again', 'error');
      log.error('Error creating farcaster signer', {
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
      signerApprovalModalPopupState,
      farcasterProfile: farcasterProfile
        ? {
            ...farcasterProfile.body,
            connectedAddresses: Array.from(
              new Set([
                ...(farcasterProfile.connectedAddresses || []),
                ...(farcasterProfile.connectedAddress ? [farcasterProfile.connectedAddress] : [])
              ])
            )
          }
        : null
    }),
    [farcasterUser, farcasterProfile, isCreatingSigner, signerApprovalModalPopupState]
  );

  return (
    <FarcasterUserContext.Provider value={value}>
      {children}
      {signerApprovalModalPopupState.isOpen && farcasterUser && farcasterUser.status === 'pending_approval' && (
        <FarcasterSignerApprovalModal
          signerApprovalModalPopupState={signerApprovalModalPopupState}
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
