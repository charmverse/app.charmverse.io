import { log } from '@charmverse/core/log';
import type { CredentialsExpiredError, NotAuthenticatedError } from '@lens-protocol/client';
import type {
  BroadcastingError,
  InsufficientGasError,
  PendingSigningRequestError,
  ProfileId,
  TransactionError,
  UserRejectedError,
  WalletConnectionError
} from '@lens-protocol/react-web';
import { SessionType, useLogin, useProfiles, useSession } from '@lens-protocol/react-web';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useFarcasterUser } from 'hooks/useFarcasterUser';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';

export function useHandleLensError() {
  const { showMessage } = useSnackbar();
  const handlerLensError = (
    error:
      | BroadcastingError
      | PendingSigningRequestError
      | UserRejectedError
      | WalletConnectionError
      | TransactionError
      | CredentialsExpiredError
      | NotAuthenticatedError
      | InsufficientGasError
  ) => {
    let errorMessage = '';
    switch (error.name) {
      case 'BroadcastingError': {
        errorMessage = 'There was an error broadcasting the transaction';
        break;
      }

      case 'PendingSigningRequestError': {
        errorMessage = 'There is a pending signing request in your wallet. Approve it or discard it and try again.';
        break;
      }

      case 'WalletConnectionError': {
        errorMessage = 'There was an error connecting to your wallet';
        break;
      }

      case 'UserRejectedError': {
        errorMessage = 'You rejected the transaction';
        break;
      }

      case 'CredentialsExpiredError': {
        errorMessage = 'Your credentials have expired. Please log in again.';
        break;
      }

      case 'NotAuthenticatedError': {
        errorMessage = 'You are not authenticated. Please log in.';
        break;
      }

      case 'TransactionError': {
        errorMessage = 'There was an error with the transaction';
        break;
      }

      case 'InsufficientGasError': {
        errorMessage = 'There is not enough gas to complete the transaction';
        break;
      }

      default: {
        errorMessage = 'There was an error publishing to Lens';
      }
    }

    log.warn(errorMessage, {
      error
    });
    showMessage(errorMessage, 'error');
  };

  return {
    handlerLensError
  };
}

export function useLensProfile() {
  const { user } = useUser();
  const { account } = useWeb3Account();
  const { farcasterProfile } = useFarcasterUser();
  const { data: sessionData } = useSession();
  const authenticated = sessionData?.authenticated ?? false;
  const sessionProfile = sessionData?.type === SessionType.WithProfile ? sessionData?.profile : null;
  const { handlerLensError } = useHandleLensError();
  const wallet = user?.wallets[0]?.address;
  const { data: profilesData, loading } = useProfiles({
    where: {
      ownedBy: wallet ? [wallet] : account ? [account] : null
    }
  });

  const { execute } = useLogin();

  const lensProfile = sessionProfile ?? profilesData?.[0] ?? null;

  const { space } = useCurrentSpace();

  const setupLensProfile = async () => {
    if (!user || !account || (!lensProfile && !farcasterProfile)) {
      return null;
    }

    if (authenticated && lensProfile) {
      return lensProfile;
    }

    const result = await execute({
      address: account,
      profileId: (lensProfile?.id ?? farcasterProfile?.id) as ProfileId
    });

    if (result.isFailure()) {
      handlerLensError(result.error);
      return null;
    }

    return result.value;
  };

  return {
    isAuthenticated: authenticated,
    lensProfile: !isCyberConnect(space?.domain) ? lensProfile : null,
    setupLensProfile,
    loading,
    hasFarcasterProfile: !!farcasterProfile || !!lensProfile
  };
}

function isCyberConnect(domain?: string) {
  return domain === 'cyberconnect';
}
