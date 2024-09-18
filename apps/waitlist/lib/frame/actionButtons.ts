import { baseUrl } from '@root/config/constants';
import type { FrameButton, FrameButtonPostRedirect } from 'frames.js';

import type { FrameScreen } from 'lib/mixpanel/trackEventActionSchema';

import { encodeCurrentFrame } from './getInfoFromUrl';

export const scoutGameFrameTitle = 'Scout Game Waitlist';

export type FarcasterUserToEncode = {
  fid: string | number;
  username: string;
  hasJoinedWaitlist?: boolean;
};

export type FrameInteractor = {
  interactorFid: string | number;
};

export type FrameReferrer = {
  referrerFid: string | number;
  currentFrame: FrameScreen;
};

export type FrameFids = FrameInteractor & FrameReferrer;

export function joinWaitlist({ referrerFid, currentFrame }: FrameReferrer): FrameButton {
  return {
    label: 'Join waitlist',
    action: 'post',
    target: encodeCurrentFrame({ url: `${baseUrl}/api/frame/${referrerFid}/waitlist`, frame: currentFrame })
  };
}

export function shareFrameUrl(fid: string | number): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(
    `Just joined the Scout Game waitlist! Ready to scout, build, and win by spotting top onchain talents!

Join me and claim your spot by sharing this frame.`
  )}&embeds[]=${encodeURIComponent(`${baseUrl}/api/frame/${fid}/waitlist`)}`;
}

export function waitlistShareMyFrame({
  referrerFid,
  currentFrame,
  label
}: FrameReferrer & { label: string }): FrameButtonPostRedirect {
  return {
    label,
    action: 'post_redirect',
    target: encodeCurrentFrame({ url: `${baseUrl}/api/frame/${referrerFid}/actions/share`, frame: currentFrame })
  } as FrameButtonPostRedirect;
}

export function waitlistGotoHome({ referrerFid, currentFrame }: FrameReferrer): FrameButtonPostRedirect {
  return {
    label: 'Details',
    action: 'post_redirect',
    target: encodeCurrentFrame({ url: `${baseUrl}/api/frame/${referrerFid}/actions/goto-home`, frame: currentFrame })
  };
}

export function waitlistGotoScore({ referrerFid, currentFrame }: FrameReferrer): FrameButtonPostRedirect {
  return {
    label: 'Details',
    action: 'post_redirect',
    target: encodeCurrentFrame({ url: `${baseUrl}/api/frame/${referrerFid}/actions/goto-score`, frame: currentFrame })
  };
}

export function waitlistGotoBuilders({ referrerFid, currentFrame }: FrameReferrer): FrameButtonPostRedirect {
  return {
    label: "I'm a builder",
    action: 'post_redirect',
    target: encodeCurrentFrame({
      url: `${baseUrl}/api/frame/${referrerFid}/actions/goto-builders`,
      frame: currentFrame
    })
  };
}
