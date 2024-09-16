import { baseUrl } from '@root/config/constants';
import { getFrameHtml } from 'frames.js';

import { scoutGameFrameTitle, waitlistGotoScore, waitlistShareMyFrame } from 'lib/frame/actionButtons';

type Props = {
  percentile: string | number;
  referrerFid: string | number;
};

export async function WaitlistCurrentScoreFrame({ percentile, referrerFid }: Props) {
  const imgSrc = `${baseUrl}/api/frame/assets/current-position?percentile=${percentile}`;

  return getFrameHtml({
    title: scoutGameFrameTitle,
    image: imgSrc,
    ogImage: imgSrc,
    version: 'vNext',
    buttons: [
      waitlistGotoScore({ referrerFid, currentFrame: 'join_waitlist_current_score' }),
      waitlistShareMyFrame({ referrerFid, currentFrame: 'join_waitlist_current_score', label: 'Share & Level Up' })
    ],
    imageAspectRatio: '1:1'
  });
}
