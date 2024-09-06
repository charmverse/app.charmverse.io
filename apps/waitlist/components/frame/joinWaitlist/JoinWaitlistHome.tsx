import { baseUrl } from '@root/config/constants';

import { getWaitlistPostbackUrl } from './getWaitlistPostbackUrl';

export function JoinWaitlistHome({ referrerFid }: { referrerFid: string }) {
  const src = `${baseUrl}/images/waitlist/waitlist-intro.gif`;

  return (
    <>
      <meta name='fc:frame:image:aspect_ratio' content='1:1' />
      <meta
        name='fc:frame:post_url'
        content={getWaitlistPostbackUrl({ currentPage: 'join_waitlist_home', referrerFid })}
      />
      {/* Custom meta tags for farcaster */}
      <meta name='fc:frame' content='vNext' />
      <meta name='og:image' content={src} />
      <meta name='fc:frame:image' content={src} />
      <meta name='fc:frame:button:1' content='Join waitlist' />
      <meta name='fc:frame:button:1:action' content='post' />
      <meta name='fc:frame:button:1:action' content='post' />
    </>
  );
}
