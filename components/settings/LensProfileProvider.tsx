import type { Web3Provider } from '@ethersproject/providers';
import type { ProfileFragment } from '@lens-protocol/client';
import type { Blockchain } from 'connectors/index';
import { RPC } from 'connectors/index';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import requestNetworkChange from 'components/_app/Web3ConnectionManager/components/NetworkModal/utils/requestNetworkChange';
import { isProdEnv } from 'config/constants';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { lensClient } from 'lib/lens/lensClient';

const CHAIN: Blockchain = isProdEnv ? 'POLYGON' : 'MUMBAI';

export type ILensProfileContext = {
  lensProfile: ProfileFragment | null;
  setupLensProfile: () => Promise<void>;
};

export const LensProfileContext = createContext<Readonly<ILensProfileContext>>({
  lensProfile: null,
  setupLensProfile: () => new Promise(() => {})
});

export function LensProfileProvider({ children }: { children: React.ReactNode }) {
  const [lensProfile, setLensProfile] = useState<ProfileFragment | null>(null);
  const { account, library, chainId } = useWeb3AuthSig();
  const { user } = useUser();

  async function fetchLensProfile() {
    if (!user || !account) {
      return;
    }

    const lensProfiles = await lensClient.profile.fetchAll({
      ownedBy: [account],
      limit: 1
    });

    if (lensProfiles.items.length > 0) {
      setLensProfile(lensProfiles.items[0]);
    }
  }

  useEffect(() => {
    async function setup() {
      if (!user || !account) {
        return;
      }

      const isAuthenticated = await lensClient.authentication.isAuthenticated();
      if (!isAuthenticated) {
        return;
      }

      await fetchLensProfile();
    }

    setup();
  }, [user, chainId, account]);

  async function authenticateLensProfile() {
    if (!user || !account) {
      return;
    }

    const isAuthenticated = await lensClient.authentication.isAuthenticated();
    if (!isAuthenticated) {
      const challenge = await lensClient.authentication.generateChallenge(account);
      const web3Provider: Web3Provider = library;
      const signature = await web3Provider.getSigner(account).signMessage(challenge);
      await lensClient.authentication.authenticate(account, signature);
    }
    await fetchLensProfile();
  }

  async function setupLensProfile() {
    if (chainId !== RPC[CHAIN].chainId) {
      requestNetworkChange(CHAIN, authenticateLensProfile);
    } else {
      authenticateLensProfile();
    }
  }

  const value = useMemo<ILensProfileContext>(
    () => ({
      lensProfile,
      setupLensProfile
    }),
    [lensProfile]
  );

  return <LensProfileContext.Provider value={value}>{children}</LensProfileContext.Provider>;
}

export const useLensProfile = () => useContext(LensProfileContext);
