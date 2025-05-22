import { log } from '@charmverse/core/log';
import { textOnly } from '@lens-protocol/metadata';
import type { Session } from '@lens-protocol/react-web';
import { SessionType, useCreateComment, useCreatePost } from '@lens-protocol/react-web';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { switchActiveNetwork } from '@packages/lib/blockchain/switchNetwork';
import { LensChain } from '@packages/lib/lens/constants';
import { useState } from 'react';

import { useUploadToArweave } from 'charmClient/hooks/lens';
import { usePageComments } from 'components/[pageId]/DocumentPage/components/CommentsFooter/usePageComments';
import { useHandleLensError, useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';

import { usePage } from './usePage';

async function switchNetwork() {
  return switchActiveNetwork(LensChain);
}

export type CreateLensPublicationParams = {
  onError: VoidFunction;
  onSuccess: VoidFunction;
  link: string;
  pageId: string;
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
  const { onError, onSuccess, pageId, publicationType, link } = params;
  const { space } = useCurrentSpace();
  const { execute: createPost } = useCreatePost();
  const { updateComment } = usePageComments(pageId);
  const { execute: createComment } = useCreateComment();
  const { chainId } = useWeb3Account();
  const { updatePage } = usePage({
    pageIdOrPath: pageId,
    spaceId: space?.id
  });
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
        publicationType === 'comment' ? `\n\nView on CharmVerse ${link}?commentId=${params.commentId}` : ''
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
        await updatePage({
          id: pageId,
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
