import { log } from '@charmverse/core/log';
import type { Web3Provider } from '@ethersproject/providers';
import type { ProfileFragment } from '@lens-protocol/client';
import type { Blockchain } from 'connectors/index';
import { RPC } from 'connectors/index';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import requestNetworkChange from 'components/_app/Web3ConnectionManager/components/NetworkModal/utils/requestNetworkChange';
import { isProdEnv } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { createPostPublication } from 'lib/lens/createPostPublication';
import { lensClient } from 'lib/lens/lensClient';
import type { PageWithContent } from 'lib/pages';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';

const CHAIN: Blockchain = isProdEnv ? 'POLYGON' : 'MUMBAI';

export type ILensProfileContext = {
  lensProfile: ProfileFragment | null;
  setupLensProfile: () => Promise<void>;
  createPost: (proposal: PageWithContent) => Promise<void>;
};

const LENS_PROPOSAL_PUBLICATION_LENGTH = 1000;

export const LensProfileContext = createContext<Readonly<ILensProfileContext>>({
  lensProfile: null,
  setupLensProfile: () => new Promise(() => {}),
  createPost: () => new Promise(() => {})
});

export function LensProfileProvider({ children }: { children: React.ReactNode }) {
  const [lensProfile, setLensProfile] = useState<ProfileFragment | null>(null);
  const { account, library, chainId } = useWeb3AuthSig();
  const { user } = useUser();
  const { space } = useCurrentSpace();

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
  }, [user?.id, chainId, account]);

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

  async function createPost(proposal: PageWithContent) {
    if (!lensProfile || !user?.autoLensPublish || !space) {
      return;
    }

    const markdownContent = await generateMarkdown({
      content: proposal.content,
      title: proposal.title
    });

    createPostPublication({
      contentText: markdownContent.slice(0, LENS_PROPOSAL_PUBLICATION_LENGTH),
      proposalLink: `https://app.charmverse.io/${space.domain}/${proposal.path}`,
      lensProfile
    }).catch((error) => {
      log.error('Publishing proposal to Lens failed', {
        error,
        proposalId: proposal.id,
        spaceId: space.id
      });
    });
  }

  const value = useMemo<ILensProfileContext>(
    () => ({
      lensProfile,
      setupLensProfile,
      createPost
    }),
    [lensProfile, user, space, setupLensProfile, createPost]
  );

  return <LensProfileContext.Provider value={value}>{children}</LensProfileContext.Provider>;
}

export const useLensProfile = () => useContext(LensProfileContext);
