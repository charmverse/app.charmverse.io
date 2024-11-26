import { getLastWeek } from '@packages/scoutgame/dates';
import { getUserByPathCached } from '@packages/scoutgame/users/getUserByPathCached';
import { notFound } from 'next/navigation';

export default async function Claim({
  params,
  searchParams
}: {
  params: { path: string };
  searchParams: { week?: string };
}) {
  const user = await getUserByPathCached(params.path);
  if (!user) {
    return notFound();
  }

  const claimScreenUrl = `https://cdn.charmverse.io/points-claim/${user.id}/${searchParams.week || getLastWeek()}.png`;

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
      <meta name='og:url' content={`https://scoutgame.xyz/u/${params.path}`} />
      <meta name='og:title' content={`Scout Game - ${user.displayName}`} />
      <meta name='og:description' content={`Points claim screen for ${user.displayName}`} />

      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={`Scout Game - ${user.displayName}`} />
      <meta name='twitter:description' content={`Points claim screen for ${user.displayName}`} />
      <meta name='twitter:image' content={claimScreenUrl} />
      <meta name='twitter:url' content={`https://scoutgame.xyz/u/${params.path}`} />
    </>
  );
}
