import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProfileDetailsPage } from 'components/profile/[username]/ProfileDetailsPage';
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
  const tab = searchParams.tab;

  if (!user || typeof tab !== 'string') {
    return notFound();
  }

  return <ProfileDetailsPage user={user} tab={tab} />;
}
