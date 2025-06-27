import { log } from '@packages/core/log';
import { isValidUrl } from '@packages/lib/utils/isValidUrl';
import type { FrameButton } from 'frames.js';

import { useFarcasterFrameAction, useGetFarcasterFrame } from 'charmClient/hooks/farcaster';

import { useConfirmationModal } from './useConfirmationModal';
import { useFarcasterUser } from './useFarcasterUser';
import { useSnackbar } from './useSnackbar';

export function useFarcasterFrame(args?: { pageId?: string; frameUrl: string }) {
  const { showMessage } = useSnackbar();
  const { trigger: triggerFrameAction, isMutating: isLoadingFrameAction } = useFarcasterFrameAction();
  const { farcasterUser } = useFarcasterUser();
  const {
    data: farcasterFrame,
    isLoading: isLoadingFrame,
    mutate: getFarcasterFrame,
    error
  } = useGetFarcasterFrame(args);
  const { showConfirmation } = useConfirmationModal();
  const submitOption = async ({
    button,
    inputText,
    index
  }: {
    index: number;
    button: FrameButton;
    inputText: string;
  }) => {
    try {
      if (!farcasterUser || !farcasterUser.fid || !farcasterFrame) {
        return;
      }

      if (button.action === 'link' && isValidUrl(button.target)) {
        await showConfirmation({
          message: `You are about to be redirected to ${button.target}`,
          title: 'Leaving CharmVerse',
          async onConfirm() {
            if (button.target) {
              window.open(button.target, '_blank');
            }
          }
        });
        return;
      }

      const frameAction = await triggerFrameAction({
        fid: farcasterUser.fid,
        postUrl: farcasterFrame.postUrl ?? args!.frameUrl,
        privateKey: farcasterUser.privateKey,
        pageId: args?.pageId,
        postType: button.action,
        buttonIndex: index + 1,
        inputText
      });

      if (!frameAction) {
        showMessage('Error submitting frame action', 'error');
        return;
      }

      if ('location' in frameAction) {
        const location = frameAction.location;
        await showConfirmation({
          message: `You are about to be redirected to ${location}`,
          title: 'Leaving CharmVerse',
          async onConfirm() {
            if (location) {
              window.open(location, '_blank');
            }
          }
        });

        return null;
      }
      // Sometimes the returned frame is not complete, if so use the existing frame
      else if (frameAction.frame && frameAction.frame.postUrl && frameAction.frame.version) {
        return getFarcasterFrame(frameAction.frame, {
          revalidate: false,
          optimisticData: frameAction.frame
        });
      }
    } catch (e: any) {
      showMessage(e.message ?? 'Error submitting frame action', 'error');
      log.error('Error submitting frame action', {
        error: e,
        postUrl: farcasterFrame?.postUrl ?? args?.frameUrl
      });
    }
  };

  return {
    isLoadingFrameAction,
    farcasterFrame,
    isLoadingFrame,
    submitOption,
    getFarcasterFrame,
    error
  };
}
