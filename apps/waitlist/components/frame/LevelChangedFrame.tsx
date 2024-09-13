import { baseUrl } from '@root/config/constants';
import { getFrameHtml } from 'frames.js';

import { scoutGameFrameTitle, waitlistGotoHome, waitlistShareMyFrame } from 'lib/frame/actionButtons';
import type { FrameScreen } from 'lib/mixpanel/trackEventActionSchema';
import type { TierChange } from 'lib/scoring/constants';
import { getTier } from 'lib/scoring/constants';

export type LevelChangedFrameProps = {
  referrerFid: number;
  percentile: number;
  tierChange: TierChange;
};

export const levelChangedButtonIndexMap = {
  1: 'waitlist_info',
  2: 'visit_details',
  3: 'share_frame'
};

export function LevelChangedFrame({ referrerFid, percentile, tierChange }: LevelChangedFrameProps) {
  const tier = getTier(percentile);

  const imgSrc = `${baseUrl}/images/waitlist/${tierChange}-${tier}.gif`;

  const currentFrame = `waitlist_level_${tierChange}` as FrameScreen;

  const apiUrl = `${baseUrl}/api/frame/${referrerFid}/level-changed?tierChange=${tierChange}&current_frame=${currentFrame}`;

  return getFrameHtml({
    title: scoutGameFrameTitle,
    image: imgSrc,
    ogImage: imgSrc,
    imageAspectRatio: '1:1',
    version: 'vNext',
    buttons: [
      {
        action: 'post',
        label: "What's this?",
        target: apiUrl
      },
      waitlistGotoHome({
        referrerFid,
        currentFrame
      }),
      waitlistShareMyFrame({
        currentFrame,
        label: 'Share & Earn Pts',
        referrerFid
      })
    ]
  });
}
