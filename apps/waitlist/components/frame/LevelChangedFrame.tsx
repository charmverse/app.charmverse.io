import { baseUrl } from '@root/config/constants';
import { getFrameHtml } from 'frames.js';

import { joinWaitlist } from 'lib/frame/actionButtons';
import type { TierChange } from 'lib/scoring/constants';
import { getTier } from 'lib/scoring/constants';

export type LevelChangedFrameProps = {
  fid: string | number;
  percentile: number;
  tierChange: TierChange;
};

export const levelChangedButtonIndexMap = {
  1: 'waitlist_info',
  2: 'visit_details',
  3: 'share_frame'
};

export function LevelChangedFrame({ fid, percentile, tierChange }: LevelChangedFrameProps) {
  const tier = getTier(percentile);

  const imgSrc = `${baseUrl}/images/waitlist/${tierChange}-${tier}.gif`;

  return getFrameHtml({
    image: imgSrc,
    ogImage: imgSrc,
    imageAspectRatio: '1:1',
    version: 'vNext',
    buttons: [
      {
        action: 'post',
        label: "What's this?",
        target: `${baseUrl}/api/frame/${fid}/level-changed`
      },
      {
        action: 'post_redirect',
        label: 'Details',
        target: `${baseUrl}/api/frame/${fid}/level-changed`
      },
      {
        action: 'post_redirect',
        label: 'Share & Earn Pts',
        target: `${baseUrl}/api/frame/${fid}/level-changed`
      }
    ]
  });
}
