import { ProfileDetailsPage } from '@connect/components/profile/[username]/ProfileDetailsPage';
import { fetchUserByFarcasterUsername } from '@connect/lib/actions/fetchUserByFarcasterUsername';

export const dynamic = 'force-dynamic';

export default async function Profile({ params }: { params: { username: string } }) {
  const farcasterUser = await fetchUserByFarcasterUsername(params.username);
  return <ProfileDetailsPage user={farcasterUser} />;
}
