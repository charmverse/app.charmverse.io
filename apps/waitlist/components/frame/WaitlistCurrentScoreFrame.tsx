import { baseUrl } from '@root/config/constants';
import { getFrameHtml } from 'frames.js';

import type { FarcasterUserToEncode } from 'lib/frame/actionButtons';
import { waitlistGetDetails, waitlistShareMyFrame } from 'lib/frame/actionButtons';

type Props = {
  percentile: string | number;
} & FarcasterUserToEncode;

export async function WaitlistCurrentScoreFrame({ percentile, fid, username }: Props) {
  const imgSrc = `${baseUrl}/api/frame/assets/current-position?percentile=${percentile}`;

  return getFrameHtml({
    image: imgSrc,
    ogImage: imgSrc,
    version: 'vNext',
    buttons: [await waitlistGetDetails({ fid, username, hasJoinedWaitlist: true }), waitlistShareMyFrame(fid)],
    imageAspectRatio: '1:1'
  });
}
