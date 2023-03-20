import { useEffect } from 'react';

import charmClient from 'charmClient';
import { PublicProfile } from 'components/profile/PublicProfile';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';

export default function ProfileSettings() {
  const { user, setUser } = useUser();

  useEffect(() => {
    charmClient.track.trackAction('page_view', { type: 'profile' });
  }, []);

  if (!user) {
    return null;
  }

  return (
    <>
      <Legend>My profile</Legend>
      <PublicProfile user={user} updateUser={setUser} />
    </>
  );
}
