import type { Metadata, ResolvingMetadata } from 'next';
import type { ResolvedOpenGraph } from 'next/dist/lib/metadata/types/opengraph-types';
import { notFound } from 'next/navigation';

import { FarcasterMetadata } from 'components/[username]/FarcasterMetadata';
import { PublicProfilePage } from 'components/[username]/PublicProfilePage';
import { getUserByPath } from 'lib/users/getUserByPath';

export const dynamic = 'force-dynamic';

type Props = {
  params: { username: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const user = await getUserByPath(params.username);

  if (!user) {
    return {};
  }

  const previousMetadata = await parent;
  const previousOg = previousMetadata.openGraph || ({} as ResolvedOpenGraph);

  return {
    title: `${user.username} user profile`,
    openGraph: {
      images: user.nftImageUrl || user.avatar || previousOg.images || '',
      title: `${user.username} user profile`
    },
    twitter: {
      title: `${user.username} user profile`
    }
  };
}

export default async function Profile({ params, searchParams }: Props) {
  const user = await getUserByPath(params.username);
  const tab = searchParams.tab || (user?.builderStatus === 'approved' ? 'builder' : 'scout');

  if (!user || typeof tab !== 'string') {
    return notFound();
  }

  return (
    <>
      <FarcasterMetadata user={user} />
      <PublicProfilePage user={user} tab={tab} />
    </>
  );
}
