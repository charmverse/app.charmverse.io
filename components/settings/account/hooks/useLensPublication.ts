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
import { RPC } from 'connectors/index';

import { useUpdateProposalLensProperties } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { createCommentPublication } from 'lib/lens/createCommentPublication';
import { createPostPublication } from 'lib/lens/createPostPublication';
import { LensChain, lensClient } from 'lib/lens/lensClient';
import type { PageWithContent } from 'lib/pages';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';

import { useLensProfile } from './useLensProfile';

type LensPublicationResponse =
  | Awaited<ReturnType<Publication['createDataAvailabilityPostViaDispatcher']>>
  | Awaited<ReturnType<Publication['createDataAvailabilityPostTypedData']>>
  | Awaited<ReturnType<Publication['createDataAvailabilityCommentTypedData']>>
  | Awaited<ReturnType<Publication['createDataAvailabilityCommentViaDispatcher']>>;

const LENS_PROPOSAL_PUBLICATION_LENGTH = 50;

async function switchNetwork() {
  return switchActiveNetwork(RPC[LensChain].chainId);
}

export function useLensPublication({
  proposalId,
  proposalPath,
  proposalTitle
}: {
  proposalId: string;
  proposalPath: string;
  proposalTitle: string;
}) {
  const { account, library, chainId } = useWeb3AuthSig();
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { lensProfile, setupLensProfile } = useLensProfile();
  const { trigger: updateProposalLensProperties } = useUpdateProposalLensProperties({ proposalId });

  async function createPublication(
    params: { content: PageContent } & (
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
    let _lensProfile = lensProfile;
    const { publicationType, content } = params;

    if (!space || !account) {
      return;
    }

    // If the user is not currently authenticated, try to authenticate them rather than doing nothing
    if (!lensProfile) {
      _lensProfile = await setupLensProfile();
    }

    // User doesn't have a profile or rejected signing the challenge
    if (!_lensProfile) {
      return null;
    }

    if (chainId !== RPC[LensChain].chainId) {
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
        data: LensPublicationResponse;
      };

      let broadcastResponse: Result<
        CreateDataAvailabilityPublicationResultFragment | RelayErrorFragment,
        CredentialsExpiredError | NotAuthenticatedError
      > | null = null;

      if (publicationType === 'post') {
        publicationResponse = await createPostPublication({
          contentText: `Proposal **${proposalTitle}** from **${space.name}** is now open for feedback.\n\n${finalMarkdownContent}`,
          proposalLink: `https://app.charmverse.io/${space.domain}/${proposalPath}`,
          lensProfile: _lensProfile
        });
      } else {
        publicationResponse = await createCommentPublication({
          contentText: `I just commented on **${proposalTitle}** from **${space.name}**\n\n${finalMarkdownContent}`,
          postId: params.lensPostId,
          lensProfile: _lensProfile,
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

  async function createLensPost({ proposalContent }: { proposalContent: PageContent }) {
    const createdPost = (await createPublication({
      publicationType: 'post',
      content: proposalContent
    })) as CreateDataAvailabilityPublicationResultFragment | CreatePostTypedDataFragment;

    if (createdPost) {
      await updateProposalLensProperties({
        lensPostLink: createdPost.id
      });
    }

    return createdPost;
  }

  async function createLensComment({
    commentId,
    lensPostId,
    commentContent
  }: {
    commentContent: PageContent;
    proposal: PageWithContent;
    commentId: string;
    lensPostId: string;
  }) {
    return createPublication({
      content: commentContent,
      commentId,
      lensPostId,
      publicationType: 'comment'
    });
  }

  return {
    createLensPost,
    createLensComment
  };
}
