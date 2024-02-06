import type { ActionIndex } from 'frames.js';

import { useFarcasterFrameAction, useGetFarcasterFrame } from 'charmClient/hooks/farcaster';
import { createFrameActionMessageWithSignerKey } from 'lib/farcaster/createFrameActionMessageWithSignerKey';

import { useFarcasterUser } from './useFarcasterUser';
import { useSnackbar } from './useSnackbar';

export function useFarcasterFrame(args?: { pageId: string; frameUrl: string }) {
  const { showMessage } = useSnackbar();
  const { trigger: triggerFrameAction, isMutating: isLoadingFrameAction } = useFarcasterFrameAction();
  const { farcasterUser, startFarcasterSignerProcess, logout, loading: isLoadingFarcasterUser } = useFarcasterUser();
  const { data: farcasterFrame, isLoading: isLoadingFrame, mutate, error } = useGetFarcasterFrame(args);

  const submitOption = async ({ buttonIndex, inputText }: { buttonIndex: number; inputText: string }) => {
    if (!farcasterUser || !farcasterUser.fid || !farcasterFrame) {
      return;
    }

    const button = farcasterFrame.buttons![buttonIndex - 1];

    const castId = {
      fid: 1,
      hash: new Uint8Array(Buffer.from('0000000000000000000000000000000000000000', 'hex'))
    };

    const { message, trustedBytes } = await createFrameActionMessageWithSignerKey(farcasterUser.privateKey, {
      fid: farcasterUser.fid,
      buttonIndex,
      castId,
      url: Buffer.from(farcasterFrame.postUrl),
      inputText: Buffer.from(inputText)
    });

    if (!message) {
      showMessage('Error creating frame action message', 'error');
      return;
    }

    const frameAction = await triggerFrameAction({
      postType: button.action,
      frameAction: {
        untrustedData: {
          fid: farcasterUser.fid,
          url: farcasterFrame.postUrl,
          messageHash: `0x${Buffer.from(message.hash).toString('hex')}`,
          timestamp: message.data.timestamp,
          network: 1,
          buttonIndex: Number(message.data.frameActionBody.buttonIndex) as ActionIndex,
          castId: {
            fid: castId.fid,
            hash: `0x${Buffer.from(castId.hash).toString('hex')}`
          },
          inputText
        },
        trustedData: {
          messageBytes: trustedBytes
        }
      }
    });

    if (!frameAction) {
      showMessage('Error submitting frame action', 'error');
      return;
    }

    if ('location' in frameAction) {
      const location = frameAction.location;
      // TODO: Replace with a global modal action
      if (window.confirm(`You are about to be redirected to ${location!}`)) {
        window.location.href = location!;
      }
      return null;
    } else {
      return mutate(frameAction.frame, {
        revalidate: false,
        optimisticData: frameAction.frame
      });
    }
  };

  return {
    isLoadingFrameAction,
    farcasterUser,
    isLoadingFarcasterUser,
    farcasterFrame,
    isLoadingFrame,
    submitOption,
    error,
    startFarcasterSignerProcess,
    logout
  };
}
