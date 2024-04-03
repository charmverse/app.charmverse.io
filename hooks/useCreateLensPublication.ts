import { log } from '@charmverse/core/log';
import { textOnly } from '@lens-protocol/metadata';
import type { Session } from '@lens-protocol/react-web';
import { SessionType, useCreateComment, useCreatePost } from '@lens-protocol/react-web';
import { useState } from 'react';

import { useUploadToArweave } from 'charmClient/hooks/lens';
import { useUpdateProposalLensProperties } from 'charmClient/hooks/proposals';
import { usePageComments } from 'components/[pageId]/DocumentPage/components/CommentsFooter/usePageComments';
import { useHandleLensError, useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { LensChain } from 'lib/lens/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { generateMarkdown } from 'lib/prosemirror/markdown/generateMarkdown';

async function switchNetwork() {
  return switchActiveNetwork(LensChain);
}

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
  const [isPublishingToLens, setIsPublishingToLens] = useState(false);
  const { trigger } = useUploadToArweave();
  const { setupLensProfile } = useLensProfile();
  const { account } = useWeb3Account();
  async function createLensPublication({ content }: { content: PageContent }) {
    try {
      setIsPublishingToLens(true);
      if (!space || !account) {
        return null;
      }

      if (chainId !== LensChain) {
        await switchNetwork();
      }

      const lensProfile = await setupLensProfile();

      if (!lensProfile) {
        onError();
        return null;
      }

      const markdownContent = await generateMarkdown({
        content
      });

      const finalMarkdownContent = `${markdownContent}${
        publicationType === 'comment' ? `\n\nView on CharmVerse ${proposalLink}?commentId=${params.commentId}` : ''
      }`;

      const metadata = textOnly({ content: finalMarkdownContent });

      const uri = await trigger({
        metadata
      });

      const capitalizedPublicationType = publicationType.charAt(0).toUpperCase() + publicationType.slice(1);
      if (!uri) {
        onError();
        return null;
      }

      const session: Session = {
        type: SessionType.WithProfile,
        profile: lensProfile,
        authenticated: true,
        address: account
      };

      const createPublicationResult =
        publicationType === 'post'
          ? await createPost({
              metadata: uri,
              session
            })
          : await createComment({
              metadata: uri,
              commentOn: params.parentPublicationId as any,
              session
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
    } finally {
      setIsPublishingToLens(false);
    }
  }

  return {
    isPublishingToLens,
    createLensPublication
  };
}
