'use client';

import { baseUrl } from '@root/config/constants';

import type { TierChange } from 'lib/scoring/constants';
import { getTier } from 'lib/scoring/constants';

export const dynamic = 'force-dynamic';

export type LevelChangedFrameProps = {
  fid: string;
  percentile: number;
  tierChange: TierChange;
};

export function LevelChangedHomeFrame({ fid, percentile, tierChange }: LevelChangedFrameProps) {
  const tier = getTier(percentile);

  const src = `${baseUrl}/images/waitlist/${tierChange}-${tier}.gif`;

  return (
    <>
      <meta name='fc:frame:image:aspect_ratio' content='1:1' />
      {/* Custom meta tags for farcaster */}
      <meta name='fc:frame' content='vNext' />
      <meta name='og:image' content={src} />
      <meta name='fc:frame:image' content={src} />
      {/* Redirect to main frame */}
      <meta name='fc:frame:button:1' content="What's this?" />
      <meta name='fc:frame:button:1:action' content='post_redirect' />
      <meta property='fc:frame:button:1:post_url' content='https://frame.example.com/tx_callback' />
      {/* Go to scoutgame */}
      <meta name='fc:frame:button:2' content='Details waitlist' />
      <meta name='fc:frame:button:2:action' content='post_redirect' />
      {/* Go to Warpcast with */}
      <meta name='fc:frame:button:3' content='Join waitlist' />
      <meta name='fc:frame:button:3:action' content='post' />
      <meta property='fc:frame:button:3:post_url' content='https://frame.example.com/tx_callback' />
    </>
  );
}
