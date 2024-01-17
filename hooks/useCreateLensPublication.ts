import { log } from '@charmverse/core/log';
import { textOnly } from '@lens-protocol/metadata';
import { useCreateComment, useCreatePost } from '@lens-protocol/react-web';

import { useUpdateProposalLensProperties } from 'charmClient/hooks/proposals';
import { usePageComments } from 'components/[pageId]/DocumentPage/components/CommentsFooter/usePageComments';
import { useHandleLensError } from 'components/settings/account/hooks/useLensProfile';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { LensChain } from 'lib/lens/lensClient';
import { uploadToArweave } from 'lib/lens/uploadToArweave';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';

async function switchNetwork() {
  return switchActiveNetwork(LensChain);
}

const LENS_PROPOSAL_PUBLICATION_LENGTH = 50;

export type CreateLensPublicationParams = {
  onError: VoidFunction;
  onSuccess: VoidFunction;
  proposalLink: string;
  proposalId: string;
} & (
  | {
      publicationType: 'post';
    }
  | {
      commentId: string;
      parentPublicationId: string;
      publicationType: 'comment';
    }
);

export function useCreateLensPublication(params: CreateLensPublicationParams) {
  const { onError, onSuccess, proposalId, publicationType, proposalLink } = params;
  const { execute: createPost } = useCreatePost();
  const { updateComment } = usePageComments(proposalId);
  const { execute: createComment } = useCreateComment();
  const { chainId } = useWeb3Account();
  const { trigger: updateProposalLensProperties } = useUpdateProposalLensProperties({ proposalId });
  const { space } = useCurrentSpace();
  const { handlerLensError } = useHandleLensError();
  const { showMessage } = useSnackbar();

  async function createLensPublication({ content }: { content: PageContent }) {
    try {
      if (!space) {
        return null;
      }

      if (chainId !== LensChain) {
        await switchNetwork();
      }

      const markdownContent = await generateMarkdown({
        content
      });

      const trimmedMarkdownContent =
        markdownContent.length > LENS_PROPOSAL_PUBLICATION_LENGTH
          ? `${markdownContent.slice(0, LENS_PROPOSAL_PUBLICATION_LENGTH)}...`
          : markdownContent;

      const finalMarkdownContent = `${trimmedMarkdownContent}${
        publicationType === 'comment' ? `\n\nView on CharmVerse ${proposalLink}?commentId=${params.commentId}` : ''
      }`;

      const metadata = textOnly({ content: finalMarkdownContent });

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
              commentOn: params.parentPublicationId as any
            });

      if (createPublicationResult.isFailure()) {
        handlerLensError(createPublicationResult.error);
        onError();
        return null;
      }

      const completion = await createPublicationResult.value.waitForCompletion();

      if (completion.isFailure()) {
        handlerLensError(completion.error);
        onError();
        return null;
      }

      showMessage(`${capitalizedPublicationType} published to Lens`, 'info');
      log.info(`${capitalizedPublicationType} published to Lens`, {
        spaceId: space.id,
        ...params
      });

      const createdPublication = completion.value;

      if (publicationType === 'post') {
        await updateProposalLensProperties({
          lensPostLink: createdPublication.id
        });
      } else if (params.publicationType === 'comment') {
        await updateComment({
          id: params.commentId,
          lensCommentLink: createdPublication.id
        });
      }

      onSuccess();
      return completion.value;
    } catch (err) {
      onError();
      log.error('Error creating publication', {
        err,
        ...params
      });
      showMessage('There was an error publishing to Lens', 'error');
      return null;
    }
  }

  return {
    createLensPublication
  };
}
