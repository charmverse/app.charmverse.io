'use client';

import { baseUrl } from '@root/config/constants';

import { waitlistGetDetails, waitlistShareMyFrame } from 'lib/waitlist/actionButtons';

export function LevelUpWaitlistHome() {
  const src = `${baseUrl}/images/waitlist/level-up1.jpg`;
  // const waitList = waitlistShareMyFrame(referrerFid);

  return (
    <>
      <meta name='og:title' content="What's this?" />
      <meta name='og:image' content={src} />
      <meta name='fc:frame:image:aspect_ratio' content='1:1' />
      <meta name='fc:frame:post_url' content={getWaitlistLevelsPostbackUrl({ currentPage: 'level-up' })} />
      <meta name='fc:frame' content='vNext' />
      <meta name='fc:frame:image' content={src} />
      <meta name='fc:frame:button:1' content="What's this?" />
      <meta name='fc:frame:button:1:action' content='post' />
      <meta name='fc:frame:button:2' content={waitlistGetDetails.label} />
      <meta name='fc:frame:button:2:action' content={waitlistGetDetails.action} />
      <meta name='fc:frame:button:2:target' content={waitlistGetDetails.target} />
      {/* <meta name='fc:frame:button:3' content={waitList.label} />
      <meta name='fc:frame:button:3:action' content={waitList.action} />
      <meta name='fc:frame:button:3:target' content={waitList.target} /> */}
    </>
  );
}
