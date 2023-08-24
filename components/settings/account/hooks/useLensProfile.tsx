import { log } from '@charmverse/core/log';
import type { Web3Provider } from '@ethersproject/providers';
import type { CreatePostTypedDataFragment } from '@lens-protocol/client';
import type { Blockchain } from 'connectors/index';
import { RPC } from 'connectors/index';
import useSWR from 'swr';

import { isProdEnv } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { createPostPublication } from 'lib/lens/createPostPublication';
import { lensClient } from 'lib/lens/lensClient';
import type { PageWithContent } from 'lib/pages';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';

const CHAIN: Blockchain = !isProdEnv ? 'POLYGON' : 'MUMBAI';

const LENS_PROPOSAL_PUBLICATION_LENGTH = 1000;

async function switchNetwork() {
  return switchActiveNetwork(RPC[CHAIN].chainId);
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
    if (!lensProfile || !user?.publishToLensDefault || !space || !account) {
      return;
    }

    if (chainId !== RPC[CHAIN].chainId) {
      await switchNetwork();
    }

    const markdownContent = await generateMarkdown({
      content: proposal.content,
      title: proposal.title
    });

    let failedToPublishInLens = false;
    let lensError: Error | null = null;

    try {
      const postPublication = await createPostPublication({
        contentText: markdownContent.slice(0, LENS_PROPOSAL_PUBLICATION_LENGTH),
        proposalLink: `https://app.charmverse.io/${space.domain}/${proposal.path}`,
        lensProfile
      });

      if (postPublication.data.isFailure()) {
        failedToPublishInLens = true;
        lensError = new Error(postPublication.data.error.message);
      } else if (postPublication.dispatcherUsed && postPublication.data.isSuccess()) {
        const postTypedDataFragment = postPublication.data.value as CreatePostTypedDataFragment;
        const { id, typedData } = postTypedDataFragment;
        const web3Provider: Web3Provider = library;
        const signature = await web3Provider
          .getSigner(account)
          ._signTypedData(typedData.domain, typedData.types, typedData.value);
        const broadcastResponse = await lensClient.transaction.broadcastDataAvailability({
          id,
          signature
        });

        if (broadcastResponse.isFailure()) {
          failedToPublishInLens = broadcastResponse.isFailure();
          lensError = new Error(broadcastResponse.error.message);
        } else if (broadcastResponse.value.__typename === 'RelayError') {
          failedToPublishInLens = true;
          lensError = new Error(broadcastResponse.value.reason);
        }
      }

      if (!failedToPublishInLens) {
        showMessage('Proposal published to Lens', 'info');
        log.info('Proposal published to Lens', {
          proposalId: proposal.id,
          spaceId: space.id
        });
      } else if (postPublication.data.isFailure()) {
        failedToPublishInLens = true;
        lensError = new Error(postPublication.data.error.message);
      }
    } catch (error) {
      failedToPublishInLens = true;
      lensError = error as Error;
    }

    if (lensError && failedToPublishInLens) {
      showMessage('Failed to publish proposal to Lens', 'error');
      log.error('Publishing proposal to Lens failed', {
        error: lensError,
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
