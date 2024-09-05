import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProfileDetailsPage } from 'components/profile/[username]/ProfileDetailsPage';
import { getUserByPath } from 'lib/users/getUserByPath';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'User Profile'
};

export default async function Profile({ params }: { params: { username: string } }) {
  const user = await getUserByPath(params.username);
  if (!user) {
    return notFound();
  }
  return <ProfileDetailsPage user={user} />;
}
