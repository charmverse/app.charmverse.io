import useSWR from 'swr';
import { useSignMessage } from 'wagmi';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { LensChain, lensClient } from 'lib/lens/lensClient';

async function switchNetwork() {
  return switchActiveNetwork(LensChain);
}

export function useLensProfile() {
  const { account, chainId } = useWeb3Account();
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const { signMessageAsync } = useSignMessage();

  const {
    data: lensProfileState = {
      isAuthenticated: false,
      lensProfile: null
    }
  } = useSWR(user ? ['lensProfile', user!.id] : null, async () => {
    return {
      lensProfile: await charmClient.publicProfile.getLensProfile(user!.id),
      isAuthenticated: await lensClient.authentication.isAuthenticated()
    };
  });

  async function setupLensProfile() {
    if (!user || !account) {
      return null;
    }

    if (chainId !== LensChain) {
      await switchNetwork();
    }

    const _isAuthenticated = await lensClient.authentication.isAuthenticated();
    if (_isAuthenticated) {
      return null;
    }

    const challenge = await lensClient.authentication.generateChallenge(account);
    const signature = await signMessageAsync({ message: challenge });
    await lensClient.authentication.authenticate(account, signature);
  }

  return {
    isAuthenticated: lensProfileState.isAuthenticated,
    lensProfile: !isCyberConnect(space?.domain) && lensProfileState.lensProfile,
    setupLensProfile
  };
}

function isCyberConnect(domain?: string) {
  return domain === 'cyberconnect';
}
