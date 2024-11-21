import { baseUrl } from '@root/config/constants';
import type { FrameButtonPostRedirect } from 'frames.js';

import type { FrameScreen } from 'lib/waitlist/mixpanel/trackEventActionSchema';

import { encodeCurrentFrame } from './getInfoFromUrl';

export const scoutGameFrameTitle = 'Scout Game Waitlist';

export type FrameInteractor = {
  interactorFid: string | number;
};

export type FrameReferrer = {
  referrerFid: string | number;
  currentFrame: FrameScreen;
};

export type FrameFids = FrameInteractor & FrameReferrer;

export function gotoScoutGame({ referrerFid, currentFrame }: FrameReferrer): FrameButtonPostRedirect {
  return {
    label: 'Start Scouting',
    action: 'post_redirect',
    target: encodeCurrentFrame({
      url: `${baseUrl}/api/frame/${referrerFid}/actions/goto-scoutgame`,
      frame: currentFrame
    })
  };
}
