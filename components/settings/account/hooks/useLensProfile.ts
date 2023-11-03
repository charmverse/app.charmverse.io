import type { ProfileId } from '@lens-protocol/react-web';
import { SessionType, useLogin, useProfiles, useSession } from '@lens-protocol/react-web';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { LensChain } from 'lib/lens/lensClient';

async function switchNetwork() {
  return switchActiveNetwork(LensChain);
}

export function useLensProfile() {
  const { account, chainId } = useWeb3Account();
  const { data: sessionData } = useSession();
  const authenticated = sessionData?.authenticated ?? false;
  const sessionProfile = sessionData?.type === SessionType.WithProfile ? sessionData?.profile : null;

  const { data: profilesData, loading: isLoadingProfiles } = useProfiles({
    where: {
      ownedBy: account ? [account] : null
    }
  });

  const { execute } = useLogin();
  const { showMessage } = useSnackbar();

  const lensProfile = sessionProfile ?? profilesData?.[0] ?? null;

  const { user } = useUser();
  const { space } = useCurrentSpace();

  const setupLensProfile = async () => {
    if (!user || !account) {
      return false;
    }

    if (chainId !== LensChain) {
      await switchNetwork();
    }

    if (authenticated || !lensProfile) {
      return false;
    }

    const result = await execute({
      address: account,
      profileId: lensProfile.id as ProfileId
    });

    if (result.isFailure()) {
      showMessage(result.error.name, 'error');
      return false;
    }

    return true;
  };

  return {
    isAuthenticated: authenticated,
    lensProfile: !isCyberConnect(space?.domain) && lensProfile,
    setupLensProfile,
    isLoadingProfiles
  };
}

function isCyberConnect(domain?: string) {
  return domain === 'cyberconnect';
}
