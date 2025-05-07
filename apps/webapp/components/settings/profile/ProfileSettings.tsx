import { Stack } from '@mui/material';

import { useTrackPageView } from 'charmClient/hooks/track';
import { ProfileTabs } from 'components/members/components/MemberProfile/components/ProfileTabs';
import Legend from 'components/settings/components/Legend';
import { useUser } from 'hooks/useUser';

import { UserDetailsFormWithSave } from './components/UserDetailsForm';

export default function ProfileSettings({
  setUnsavedChanges
}: {
  setUnsavedChanges: (unsavedChanges: boolean) => void;
}) {
  const { user } = useUser();

  useTrackPageView({ type: 'settings/my-profile' });

  if (!user) {
    return null;
  }

  return (
    <>
      <Legend>My Profile</Legend>
      <Stack spacing={2}>
        <UserDetailsFormWithSave user={user} setUnsavedChanges={setUnsavedChanges} />
        <ProfileTabs showAllProfileTypes user={user} />
      </Stack>
    </>
  );
}
