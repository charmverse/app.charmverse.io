import { baseUrl } from '@root/config/constants';
import { getFrameHtml } from 'frames.js';

import { joinWaitlist, scoutGameFrameTitle } from 'lib/frame/actionButtons';

export type JoinWaitlistHomeProps = {
  referrerFid: number;
};

export function JoinWaitlistFrame({ referrerFid }: JoinWaitlistHomeProps) {
  return getFrameHtml({
    title: scoutGameFrameTitle,
    image: `${baseUrl}/images/waitlist/waitlist-intro.gif`,
    ogImage: `${baseUrl}/images/waitlist/waitlist-intro.gif`,
    version: 'vNext',
    imageAspectRatio: '1:1',
    buttons: [joinWaitlist({ referrerFid, currentFrame: 'join_waitlist_info' })]
  });
}
