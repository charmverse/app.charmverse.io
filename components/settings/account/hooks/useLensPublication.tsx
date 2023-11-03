import { log } from '@charmverse/core/log';
import { textOnly } from '@lens-protocol/metadata';
import type {
  BroadcastingError,
  PendingSigningRequestError,
  TransactionError,
  UserRejectedError,
  WalletConnectionError
} from '@lens-protocol/react-web';
import { useCreateComment, useCreatePost } from '@lens-protocol/react-web';

import { useUpdateProposalLensProperties } from 'charmClient/hooks/proposals';
import { usePageComments } from 'components/[pageId]/Comments/usePageComments';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { LensChain } from 'lib/lens/lensClient';
import { uploadToArweave } from 'lib/lens/uploadToArweave';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';

import { useLensProfile } from './useLensProfile';

const LENS_PROPOSAL_PUBLICATION_LENGTH = 50;

async function switchNetwork() {
  return switchActiveNetwork(LensChain);
}

function useHandleLensError() {
  const { showMessage } = useSnackbar();
  const handlerLensError = (
    error: BroadcastingError | PendingSigningRequestError | UserRejectedError | WalletConnectionError | TransactionError
  ) => {
    let errorMessage = '';
    switch (error.name) {
      case 'BroadcastingError': {
        errorMessage = 'There was an error broadcasting the transaction';
        break;
      }

      case 'PendingSigningRequestError': {
        errorMessage = 'There is a pending signing request in your wallet. Approve it or discard it and try again.';
        break;
      }

      case 'WalletConnectionError': {
        errorMessage = 'There was an error connecting to your wallet';
        break;
      }

      case 'UserRejectedError': {
        errorMessage = 'You rejected the transaction';
        break;
      }

      default: {
        errorMessage = 'There was an error publishing to Lens';
      }
    }

    log.warn(errorMessage, {
      error
    });
    showMessage(errorMessage, 'error');
  };

  return {
    handlerLensError
  };
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
  const { execute: createPost } = useCreatePost();
  const { execute: createComment } = useCreateComment();
  const { handlerLensError } = useHandleLensError();
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
    try {
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
          const loginSuccessful = await setupLensProfile();
          if (!loginSuccessful) {
            return;
          }
        } catch (_) {
          // User deliberately cancelled the auth process
          showMessage('Publishing to Lens cancelled', 'warning');
          return null;
        }
      }

      const markdownContent = await generateMarkdown({
        content
      });

      const trimmedMarkdownContent =
        markdownContent.length > LENS_PROPOSAL_PUBLICATION_LENGTH
          ? `${markdownContent.slice(0, LENS_PROPOSAL_PUBLICATION_LENGTH)}...`
          : markdownContent;

      const finalMarkdownContent = `${
        publicationType === 'post'
          ? `Proposal **${proposalTitle}** from **${space.name}** is now open for feedback.\n\n${trimmedMarkdownContent}`
          : trimmedMarkdownContent
      }\n\nView on CharmVerse https://app.charmverse.io/${space.domain}/${proposalPath}${
        publicationType === 'comment' ? `?commentId=${params.commentId}` : ''
      }`;

      const metadata = textOnly({ content: finalMarkdownContent });

      metadata.name = `Post by @${lensProfile.handle?.localName}`;

      const uri = await uploadToArweave(metadata);
      const capitalizedPublicationType = publicationType.charAt(0).toUpperCase() + publicationType.slice(1);
      if (!uri) {
        return null;
      }

      const createPublicationResult =
        publicationType === 'post'
          ? await createPost({
              metadata: uri
            })
          : await createComment({
              metadata: uri,
              commentOn: params.lensPostId as any
            });

      if (createPublicationResult.isFailure()) {
        handlerLensError(createPublicationResult.error);
        return null;
      }

      const completion = await createPublicationResult.value.waitForCompletion();

      if (completion.isFailure()) {
        handlerLensError(completion.error);
        return null;
      }

      showMessage(`${capitalizedPublicationType} published to Lens`, 'info');
      log.info(`${capitalizedPublicationType} published to Lens`, {
        spaceId: space.id,
        ...params
      });

      return completion.value;
    } catch (err) {
      log.error('Error creating publication', {
        err,
        ...params
      });
      showMessage('There was an error publishing to Lens', 'error');
      return null;
    }
  }

  async function createLensPost({ proposalContent }: { proposalContent: PageContent }) {
    const createdPost = await createPublication({
      publicationType: 'post',
      content: proposalContent
    });

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
    const createdComment = await createPublication({
      content: commentContent,
      commentId,
      lensPostId,
      publicationType: 'comment'
    });

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
