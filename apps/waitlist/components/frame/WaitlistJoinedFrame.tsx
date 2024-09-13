import { baseUrl } from '@root/config/constants';
import { getFrameHtml } from 'frames.js';

import type { FrameReferrer } from 'lib/frame/actionButtons';
import {
  scoutGameFrameTitle,
  waitlistGotoBuilders,
  waitlistGotoScore,
  waitlistShareMyFrame
} from 'lib/frame/actionButtons';

export function WaitlistJoinedFrame(props: Pick<FrameReferrer, 'referrerFid'>) {
  const imgSrc = `${baseUrl}/images/waitlist/waitlist-joined.gif`;

  return getFrameHtml({
    title: scoutGameFrameTitle,
    image: imgSrc,
    ogImage: imgSrc,
    version: 'vNext',
    buttons: [
      waitlistGotoScore({ referrerFid: props.referrerFid, currentFrame: 'join_waitlist_new_join' }),
      waitlistGotoBuilders({ referrerFid: props.referrerFid, currentFrame: 'join_waitlist_new_join' }),
      waitlistShareMyFrame({
        referrerFid: props.referrerFid,
        currentFrame: 'join_waitlist_new_join',
        label: 'Share & Earn Pts'
      })
    ],
    imageAspectRatio: '1:1'
  });
}
