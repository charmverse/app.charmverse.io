import { log } from '@charmverse/core/log';
import { BigNumber } from '@ethersproject/bignumber';
import type { ExternalProvider, Web3Provider } from '@ethersproject/providers';
import type { CreatePostTypedDataFragment } from '@lens-protocol/client';
import type { Blockchain } from 'connectors/index';
import { RPC } from 'connectors/index';
import useSWR from 'swr';

import { isProdEnv } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { createPostPublication } from 'lib/lens/createPostPublication';
import { lensClient } from 'lib/lens/lensClient';
import type { PageWithContent } from 'lib/pages';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';

const CHAIN: Blockchain = isProdEnv ? 'POLYGON' : 'MUMBAI';
type WindowType = Window & typeof globalThis & { ethereum: ExternalProvider };

const LENS_PROPOSAL_PUBLICATION_LENGTH = 1000;

async function switchNetwork() {
  const { ethereum } = window as WindowType;
  const switchedChainId = `0x${(+BigNumber.from(RPC[CHAIN].chainId)).toString(16)}`;
  await ethereum.request?.({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: switchedChainId }]
  });
}

export function useLensProfile() {
  const { account, library, chainId } = useWeb3AuthSig();
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { data: lensProfile, mutate } = useSWR(
    user && account ? ['lensProfile', account] : null,
    async () => {
      if (!user || !account) {
        return;
      }

      const isAuthenticated = await lensClient.authentication.isAuthenticated();
      if (!isAuthenticated) {
        return;
      }

      return fetchLensProfile();
    },
    {}
  );

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

    if (chainId !== RPC[CHAIN].chainId) {
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

  async function createPost(proposal: PageWithContent) {
    if (!lensProfile || !user?.autoLensPublish || !space || !account) {
      return;
    }

    if (chainId !== RPC[CHAIN].chainId) {
      await switchNetwork();
    }

    const markdownContent = await generateMarkdown({
      content: proposal.content,
      title: proposal.title
    });

    try {
      const postPublication = await createPostPublication({
        contentText: markdownContent.slice(0, LENS_PROPOSAL_PUBLICATION_LENGTH),
        proposalLink: `https://app.charmverse.io/${space.domain}/${proposal.path}`,
        lensProfile
      });
      if (postPublication.method === 'postTypedData' && postPublication.data.isSuccess()) {
        const postTypedDataFragment = postPublication.data.value as CreatePostTypedDataFragment;
        const { id, typedData } = postTypedDataFragment;
        const web3Provider: Web3Provider = library;
        const signature = await web3Provider
          .getSigner(account)
          ._signTypedData(typedData.domain, typedData.types, typedData.value);
        await lensClient.transaction.broadcast({
          id,
          signature
        });
      }
      showMessage('Proposal published to Lens', 'info');
    } catch (error) {
      log.error('Publishing proposal to Lens failed', {
        error,
        proposalId: proposal.id,
        spaceId: space.id
      });
    }
  }

  return {
    lensProfile,
    setupLensProfile,
    createPost
  };
}
