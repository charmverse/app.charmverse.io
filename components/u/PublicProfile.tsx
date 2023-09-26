import { Stack } from '@mui/material';
import { useState } from 'react';

import MultiTabs from 'components/common/MultiTabs';
import { ProfileWidgets } from 'components/common/UserProfile/components/ProfileWidgets/ProfileWidgets';
import type { Member } from 'lib/members/interfaces';
import type { LoggedInUser } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userId]';

import { UserDetailsFormWithSave } from './components/UserDetails/UserDetailsForm';
import { UserDetailsReadonly } from './components/UserDetails/UserDetailsReadonly';
import { UserSpacesList } from './components/UserSpacesList/UserSpacesList';

export function PublicProfile(props: { user: Member | PublicUser | LoggedInUser; readOnly?: boolean }) {
  const { readOnly } = props;

  const [activeTab, setActiveTab] = useState(0);

  return (
    <Stack spacing={2}>
      {readOnly ? <UserDetailsReadonly {...props} /> : <UserDetailsFormWithSave user={props.user as LoggedInUser} />}
      <MultiTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={[
          ['Profile', <ProfileWidgets key='profile' userId={props.user.id} />],
          [
            'Organizations',
            <Stack key='organizations'>
              <UserSpacesList userId={props.user.id} />
            </Stack>
          ]
        ]}
      />
    </Stack>
  );
}
