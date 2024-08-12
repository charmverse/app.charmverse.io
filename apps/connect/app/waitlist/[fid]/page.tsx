import { baseUrl } from '@root/config/constants';

import WaitlistGif from 'public/images/waitlist/waitlist-intro.gif';

export default function WaitlistPage() {
  const src = 'https://www.gettyimages.fr/gi-resources/images/Embed/new/embed1.jpg';

  return (
    <>
      <meta name='fc:frame:post_url' content={`${baseUrl}/api/waitlist`} />
      {/* Custom meta tags for farcaster */}
      <meta name='fc:frame' content='vNext' />
      <meta name='og:image' content={src} />
      <meta name='fc:frame:image' content={src} />
      {/* Button 1 */}
      <meta name='fc:frame:button:1' content='Join waitlist' />
      <meta name='fc:frame:button:1:action' content='post_redirect' />
    </>
  );
}
