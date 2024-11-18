import { getLastWeek } from '@packages/scoutgame/dates';
import { getUserByPath } from '@packages/scoutgame/users/getUserByPath';
import { baseUrl } from '@packages/utils/constants';
import { notFound } from 'next/navigation';

export default async function Claim({ params }: { params: { path: string } }) {
  const user = await getUserByPath(params.path);
  if (!user) {
    return notFound();
  }

  const claimScreenUrl = `https://cdn.charmverse.io/points-claim/${user.id}/${getLastWeek()}.png`;

  return (
    <>
      <meta name='fc:frame' content='vNext' />
      <meta name='fc:frame:image' content={claimScreenUrl} />
      <meta property='fc:frame:image:aspect_ratio' content='1:1' />

      <meta name='fc:frame:button:1' content='My profile' />
      <meta name='fc:frame:button:1:action' content='link' />
      <meta name='fc:frame:button:1:target' content={`${process.env.DOMAIN}/u/${params.path}`} />

      <meta name='fc:frame:button:2' content='Play now' />
      <meta name='fc:frame:button:2:action' content='link' />
      <meta name='fc:frame:button:2:target' content={process.env.DOMAIN} />

      <meta name='og:image' content={claimScreenUrl} />
      <meta name='og:image:width' content='600' />
      <meta name='og:image:height' content='600' />
      <meta name='og:url' content={`${baseUrl}/points-claim/${params.path}`} />
      <meta name='og:title' content={`Scout Game - ${user.displayName}`} />
      <meta name='og:description' content={`Points claim screen for ${user.displayName}`} />

      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={`Scout Game - ${user.displayName}`} />
      <meta name='twitter:description' content={`Points claim screen for ${user.displayName}`} />
      <meta name='twitter:image' content={claimScreenUrl} />
      <meta name='twitter:url' content={`${baseUrl}/points-claim/${params.path}`} />
    </>
  );
}
