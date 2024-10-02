import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicProfilePage } from 'components/[username]/PublicProfilePage';
import { getUserByPath } from 'lib/users/getUserByPath';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'User Profile'
};

export default async function Profile({
  params,
  searchParams
}: {
  params: { username: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getUserByPath(params.username);
  const tab = searchParams.tab || (user?.builderStatus === 'approved' ? 'builder' : 'scout');

  if (!user || typeof tab !== 'string') {
    return notFound();
  }

  return (
    <>
      {user?.avatar && (
        <>
          <meta property='og:title' content={user.username} />
          <meta property='og:image' content={user.nftImageUrl} />
          {/* Custom meta tags for farcaster */}
          <meta name='fc:frame' content='vNext' />
          <meta name='fc:frame:image' content={user.nftImageUrl} />
          <meta property='fc:frame:image:aspect_ratio' content='1:1' />
          {/* Button 1 */}
          <meta name='fc:frame:button:1' content='Scout Builder' />
          <meta name='fc:frame:button:1:action' content='link' />
          <meta name='fc:frame:button:1:target' content={`${process.env.DOMAIN}/u/${user.username}`} />
        </>
      )}
      <PublicProfilePage user={user} tab={tab} />;
    </>
  );
}
