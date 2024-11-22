import { baseUrl } from '@packages/utils/env';
import { getFrameHtml } from 'frames.js';

import { gotoScoutGame, scoutGameFrameTitle } from 'lib/waitlist/frame/actionButtons';

export type JoinWaitlistHomeProps = {
  referrerFid: number;
};

export function ScoutGameLaunchedFrame({ referrerFid }: JoinWaitlistHomeProps) {
  return getFrameHtml({
    title: scoutGameFrameTitle,
    image: `${baseUrl}/images/waitlist/scoutgame-launched.png`,
    ogImage: `${baseUrl}/images/waitlist/scoutgame-launched.png`,
    version: 'vNext',
    imageAspectRatio: '1:1',
    buttons: [gotoScoutGame({ referrerFid, currentFrame: 'join_waitlist_info' })]
  });
}
