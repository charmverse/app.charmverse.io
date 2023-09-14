import { useTrackPageView } from 'charmClient/hooks/track';
import Legend from 'components/settings/Legend';
import { PublicProfile } from 'components/u/PublicProfile';
import { useUser } from 'hooks/useUser';

export default function ProfileSettings() {
  const { user } = useUser();

  useTrackPageView({ type: 'settings/my-profile' });

  if (!user) {
    return null;
  }

  return (
    <>
      <Legend>My Profile</Legend>
      <PublicProfile user={user} />
    </>
  );
}
