import { baseUrl } from '@root/config/constants';
import { getFrameHtml } from 'frames.js';

export type JoinWaitlistHomeProps = {
  referrerFid: string;
};

export function JoinWaitlistHomeFrame({ referrerFid }: JoinWaitlistHomeProps) {
  return getFrameHtml({
    image: `${baseUrl}/images/waitlist/waitlist-intro.gif`,
    ogImage: `${baseUrl}/images/waitlist/waitlist-intro.gif`,
    version: 'vNext',
    imageAspectRatio: '1:1',
    buttons: [
      {
        label: 'Join waitlist',
        action: 'post',
        target: `${baseUrl}/api/frame/${referrerFid}/actions/join-waitlist`
      }
    ]
  });
}
