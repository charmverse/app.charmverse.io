import { Stack } from '@mui/material';
import { useState } from 'react';

import MultiTabs from 'components/common/MultiTabs';
import { ProfileWidgets } from 'components/members/components/MemberProfile/components/ProfileWidgets/ProfileWidgets';
import type { Member } from 'lib/members/interfaces';
import type { LoggedInUser } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userId]';

import { UserSpacesList } from './UserSpacesList/UserSpacesList';

export function ProfileTabs(props: { user: Member | PublicUser | LoggedInUser; readOnly?: boolean }) {
  const { readOnly } = props;

  const [activeTab, setActiveTab] = useState(0);

  return (
    <MultiTabs
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={[
        ['Profile', <ProfileWidgets key='profile' readOnly={readOnly} userId={props.user.id} />, { sx: { px: 0 } }],
        [
          'Organizations',
          <Stack key='organizations'>
            <UserSpacesList userId={props.user.id} />
          </Stack>,
          { sx: { px: 0 } }
        ]
      ]}
    />
  );
}
