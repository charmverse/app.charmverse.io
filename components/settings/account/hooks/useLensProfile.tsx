import { log } from '@charmverse/core/log';
import type { Web3Provider } from '@ethersproject/providers';
import type {
  CreateCommentTypedDataFragment,
  CreateDataAvailabilityPublicationResultFragment,
  CreatePostTypedDataFragment,
  CredentialsExpiredError,
  NotAuthenticatedError,
  Publication,
  RelayErrorFragment,
  Result
} from '@lens-protocol/client';
import type { Blockchain } from 'connectors/index';
import { RPC } from 'connectors/index';
import useSWR from 'swr';

import { isDevEnv } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { createCommentPublication } from 'lib/lens/createCommentPublication';
import { createPostPublication } from 'lib/lens/createPostPublication';
import { lensClient } from 'lib/lens/lensClient';
import type { PageWithContent } from 'lib/pages';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';

const CHAIN: Blockchain = !isDevEnv ? 'MUMBAI' : 'POLYGON';

const LENS_PROPOSAL_PUBLICATION_LENGTH = 50;

async function switchNetwork() {
  return switchActiveNetwork(RPC[CHAIN].chainId);
}

export function useLensProfile() {
  const { account, library, chainId } = useWeb3AuthSig();
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();
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

  async function createPublication(
    params: {
      proposalId: string;
      proposalPath: string;
      proposalTitle: string;
      content: PageContent;
    } & (
      | {
          publicationType: 'post';
        }
      | {
          commentId: string;
          lensPostId: string;
          publicationType: 'comment';
        }
    )
  ) {
    const { proposalPath, content, proposalTitle, publicationType } = params;
    if (!lensProfile || !user?.publishToLensDefault || !space || !account) {
      return;
    }

    if (chainId !== RPC[CHAIN].chainId) {
      await switchNetwork();
    }

    const markdownContent = await generateMarkdown({
      content
    });

    let failedToPublishInLens = false;
    let lensError: Error | null = null;
    const finalMarkdownContent =
      markdownContent.length > LENS_PROPOSAL_PUBLICATION_LENGTH
        ? `${markdownContent.slice(0, LENS_PROPOSAL_PUBLICATION_LENGTH)}...`
        : markdownContent;

    const capitalizedPublicationType = publicationType.charAt(0).toUpperCase() + publicationType.slice(1);

    try {
      let publicationResponse: {
        dispatcherUsed: boolean;
        data:
          | Awaited<ReturnType<Publication['createDataAvailabilityPostViaDispatcher']>>
          | Awaited<ReturnType<Publication['createDataAvailabilityPostTypedData']>>
          | Awaited<ReturnType<Publication['createDataAvailabilityCommentTypedData']>>
          | Awaited<ReturnType<Publication['createDataAvailabilityCommentViaDispatcher']>>;
      };

      let broadcastResponse: Result<
        CreateDataAvailabilityPublicationResultFragment | RelayErrorFragment,
        CredentialsExpiredError | NotAuthenticatedError
      > | null = null;

      if (publicationType === 'post') {
        publicationResponse = await createPostPublication({
          contentText: `Proposal ${proposalTitle} from ${space.name} is now open for feedback.\n\n${finalMarkdownContent}`,
          proposalLink: `https://app.charmverse.io/${space.domain}/${proposalPath}`,
          lensProfile
        });
      } else {
        publicationResponse = await createCommentPublication({
          contentText: `I just commented on ${proposalTitle} from ${space.name}\n\n${finalMarkdownContent}`,
          postId: params.lensPostId,
          lensProfile,
          commentLink: `https://app.charmverse.io/${space.domain}/${proposalPath}?commentId=${params.commentId}`
        });
      }

      if (publicationResponse.data.isFailure()) {
        failedToPublishInLens = true;
        lensError = new Error(publicationResponse.data.error.message);
      } else if (!publicationResponse.dispatcherUsed && publicationResponse.data.isSuccess()) {
        const publicationTypedDataFragment = publicationResponse.data.value as
          | CreatePostTypedDataFragment
          | CreateCommentTypedDataFragment;
        const { id, typedData } = publicationTypedDataFragment;
        const web3Provider: Web3Provider = library;
        const signature = await web3Provider
          .getSigner(account)
          ._signTypedData(typedData.domain, typedData.types, typedData.value);
        broadcastResponse = await lensClient.transaction.broadcastDataAvailability({
          id,
          signature
        });

        if (broadcastResponse.isFailure()) {
          failedToPublishInLens = true;
          lensError = new Error(broadcastResponse.error.message);
        } else if (broadcastResponse.value.__typename === 'RelayError') {
          failedToPublishInLens = true;
          lensError = new Error(broadcastResponse.value.reason);
        }
      }

      if (!failedToPublishInLens && publicationResponse.data.isSuccess()) {
        showMessage(`${capitalizedPublicationType} published to Lens`, 'info');
        log.info(`${capitalizedPublicationType} published to Lens`, {
          spaceId: space.id,
          ...params
        });
        if (broadcastResponse?.isSuccess()) {
          return {
            ...publicationResponse.data.value,
            id: (broadcastResponse.value as { id: string }).id
          };
        }
        return publicationResponse.data.value;
      }
    } catch (error) {
      failedToPublishInLens = true;
      lensError = error as Error;
    }

    if (lensError && failedToPublishInLens) {
      showMessage(`Failed to publish ${capitalizedPublicationType} to Lens`, 'error');
      log.error(`Publishing ${capitalizedPublicationType} to Lens failed`, {
        error: lensError,
        spaceId: space.id,
        ...params
      });
    }
    return null;
  }

  async function createPost(proposal: PageWithContent) {
    const createdPost = (await createPublication({
      proposalId: proposal.id,
      proposalPath: proposal.path,
      proposalTitle: proposal.title,
      content: proposal.content as PageContent,
      publicationType: 'post'
    })) as CreateDataAvailabilityPublicationResultFragment | CreatePostTypedDataFragment;

    return createdPost;
  }

  async function createComment({
    commentId,
    lensPostId,
    proposal,
    commentContent
  }: {
    commentContent: PageContent;
    proposal: PageWithContent;
    commentId: string;
    lensPostId: string;
  }) {
    return createPublication({
      proposalId: proposal.id,
      proposalPath: proposal.path,
      proposalTitle: proposal.title,
      content: commentContent,
      commentId,
      lensPostId,
      publicationType: 'comment'
    });
  }

  return {
    lensProfile,
    setupLensProfile,
    createPost,
    createComment
  };
}
