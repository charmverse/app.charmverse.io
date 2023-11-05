import { log } from '@charmverse/core/log';
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

import { useUpdateProposalLensProperties } from 'charmClient/hooks/proposals';
import { usePageComments } from 'components/[pageId]/Comments/usePageComments';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { createCommentPublication } from 'lib/lens/createCommentPublication';
import { createPostPublication } from 'lib/lens/createPostPublication';
import { LensChain, lensClient } from 'lib/lens/lensClient';
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
  return switchActiveNetwork(LensChain);
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
  const { account, chainId } = useWeb3Account();
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { lensProfile, isAuthenticated, setupLensProfile } = useLensProfile();
  const { trigger: updateProposalLensProperties } = useUpdateProposalLensProperties({ proposalId });
  const { updateComment } = usePageComments(proposalId);
  const { signer } = useWeb3Signer();

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
    const { publicationType, content } = params;

    if (!space || !account || !lensProfile || !signer) {
      return null;
    }

    if (chainId !== LensChain) {
      await switchNetwork();
    }

    // If the user is not currently authenticated, try to authenticate them rather than doing nothing
    if (!isAuthenticated) {
      try {
        await setupLensProfile();
      } catch (_) {
        // User deliberately cancelled the auth process
        showMessage('Publishing to Lens cancelled', 'warning');
        return null;
      }
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
          lensProfile
        });
      } else {
        publicationResponse = await createCommentPublication({
          contentText: finalMarkdownContent,
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
        const signature = await signer?._signTypedData(typedData.domain, typedData.types, typedData.value);
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
    commentId: string;
    lensPostId: string;
  }) {
    const createdComment = (await createPublication({
      content: commentContent,
      commentId,
      lensPostId,
      publicationType: 'comment'
    })) as CreateDataAvailabilityPublicationResultFragment | CreateCommentTypedDataFragment;

    if (createdComment) {
      await updateComment({
        id: commentId,
        lensCommentLink: createdComment.id
      });
    }
  }

  return {
    createLensPost,
    createLensComment
  };
}
