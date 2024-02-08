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
  const submitOption = async ({ buttonIndex, inputText }: { buttonIndex: number; inputText: string }) => {
    try {
      if (!farcasterUser || !farcasterUser.fid || !farcasterFrame) {
        return;
      }

      const button = farcasterFrame.buttons ? farcasterFrame.buttons[buttonIndex - 1] : null;

      const frameAction = await triggerFrameAction({
        fid: farcasterUser.fid,
        postUrl: farcasterFrame.postUrl ?? args?.frameUrl,
        privateKey: farcasterUser.privateKey,
        pageId: args?.pageId,
        postType: button?.action,
        buttonIndex,
        inputText
      });

      if (!frameAction) {
        showMessage('Error submitting frame action', 'error');
        return;
      }

      if ('location' in frameAction) {
        const location = frameAction.location;
        await showConfirmation({
          message: `You are about to be redirected to ${location!}`,
          title: 'Leaving CharmVerse',
          async onConfirm() {
            if (location) {
              window.open(location, '_blank');
            }
          }
        });

        return null;
      } else {
        return getFarcasterFrame(frameAction.frame, {
          revalidate: false,
          optimisticData: frameAction.frame
        });
      }
    } catch (e) {
      showMessage('Error submitting frame action', 'error');
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
