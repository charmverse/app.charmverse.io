import { ProfileDetailsPage } from '@connect/components/profile/[username]/ProfileDetailsPage';
import { fetchUserByFarcasterUsername } from '@connect/lib/farcaster/fetchUserByFarcasterUsername';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Profile({ params }: { params: { username: string } }) {
  const farcasterUser = await fetchUserByFarcasterUsername(params.username);
  if (!farcasterUser) {
    return notFound();
  }
  return <ProfileDetailsPage user={farcasterUser} />;
}
