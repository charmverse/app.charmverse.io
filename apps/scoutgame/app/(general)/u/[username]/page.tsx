import type { Scout } from '@charmverse/core/prisma-client';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicProfileDetailsPage } from 'components/profile/[username]/PublicProfileDetailsPage';
import { getUserByPath } from 'lib/users/getUserByPath';
import { userCards } from 'lib/users/mock/userCards';

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
  const tab = searchParams.tab || 'scout';

  if (!user || typeof tab !== 'string') {
    return notFound();
  }

  return <PublicProfileDetailsPage user={{ ...(userCards[0] as unknown as Scout), ...user }} tab={tab} />;
}
