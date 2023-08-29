import type { Web3Provider } from '@ethersproject/providers';
import { RPC } from 'connectors/index';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { LensChain, lensClient } from 'lib/lens/lensClient';

async function switchNetwork() {
  return switchActiveNetwork(RPC[LensChain].chainId);
}

export function useLensProfile() {
  const { account, library, chainId } = useWeb3AuthSig();
  const { user } = useUser();

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

    if (chainId !== RPC[LensChain].chainId) {
      await switchNetwork();
    }

    const _isAuthenticated = await lensClient.authentication.isAuthenticated();
    if (_isAuthenticated) {
      return null;
    }

    const challenge = await lensClient.authentication.generateChallenge(account);
    const web3Provider: Web3Provider = library;
    const signature = await web3Provider.getSigner(account).signMessage(challenge);
    await lensClient.authentication.authenticate(account, signature);
  }

  return {
    ...lensProfileState,
    setupLensProfile
  };
}
