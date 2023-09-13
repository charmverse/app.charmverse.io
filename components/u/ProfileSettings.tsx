import { useEffect } from 'react';

import charmClient from 'charmClient';
import Legend from 'components/settings/Legend';
import { PublicProfile } from 'components/u/PublicProfile';
import { useUser } from 'hooks/useUser';

export default function ProfileSettings() {
  const { user } = useUser();

  useEffect(() => {
    charmClient.track.trackAction('page_view', { type: 'profile' });
  }, []);

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
