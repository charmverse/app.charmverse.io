import type { Web3Provider } from '@ethersproject/providers';
import { RPC } from 'connectors/index';
import useSWR from 'swr';

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
  const { data: lensProfile, mutate } = useSWR(user && account ? ['lensProfile', account] : null, async () => {
    if (!user || !account) {
      return;
    }

    const isAuthenticated = await lensClient.authentication.isAuthenticated();
    if (!isAuthenticated) {
      return;
    }

    return fetchLensProfile();
  });

  async function fetchLensProfile() {
    if (!user || !account) {
      return null;
    }

    const lensProfiles = await lensClient.profile.fetchAll({
      ownedBy: [account],
      limit: 1
    });

    return lensProfiles.items[0] ?? null;
  }

  async function setupLensProfile() {
    if (!user || !account) {
      return null;
    }

    if (chainId !== RPC[LensChain].chainId) {
      await switchNetwork();
    }

    const isAuthenticated = await lensClient.authentication.isAuthenticated();
    if (!isAuthenticated) {
      const challenge = await lensClient.authentication.generateChallenge(account);
      const web3Provider: Web3Provider = library;
      const signature = await web3Provider.getSigner(account).signMessage(challenge);
      await lensClient.authentication.authenticate(account, signature);
    }
    return mutate();
  }

  return {
    lensProfile,
    setupLensProfile
  };
}
