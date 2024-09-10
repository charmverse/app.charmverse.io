import { baseUrl } from '@root/config/constants';
import { getFrameHtml } from 'frames.js';

import type { FarcasterUserToEncode } from 'lib/frame/actionButtons';
import {
  scoutGameFrameTitle,
  waitlistGet10Clicks,
  waitlistGetDetails,
  waitlistShareMyFrame
} from 'lib/frame/actionButtons';

export async function WaitlistJoinedFrame({ fid, username }: FarcasterUserToEncode) {
  const imgSrc = `${baseUrl}/images/waitlist/waitlist-joined.gif`;

  return getFrameHtml({
    title: scoutGameFrameTitle,
    image: imgSrc,
    ogImage: imgSrc,
    version: 'vNext',
    buttons: [
      await waitlistGetDetails({ fid, username, hasJoinedWaitlist: true }),
      await waitlistGet10Clicks({ fid, username, hasJoinedWaitlist: true }),
      waitlistShareMyFrame(fid)
    ],
    imageAspectRatio: '1:1'
  });
}
