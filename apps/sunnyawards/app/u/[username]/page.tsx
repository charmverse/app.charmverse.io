import { fetchUserByFarcasterUsername } from '@packages/connect-shared/lib/farcaster/fetchUserByFarcasterUsername';
import { notFound } from 'next/navigation';

import { ProfileDetailsPage } from 'components/profile/[username]/ProfileDetailsPage';

export const dynamic = 'force-dynamic';

export default async function Profile({ params }: { params: { username: string } }) {
  const farcasterUser = await fetchUserByFarcasterUsername(params.username);
  if (!farcasterUser) {
    return notFound();
  }
  return <ProfileDetailsPage user={farcasterUser} />;
}
