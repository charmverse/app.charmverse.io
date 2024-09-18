import { Stack } from '@mui/material';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { useMemo, useState } from 'react';

import type { TabConfig } from 'components/common/MultiTabs';
import MultiTabs from 'components/common/MultiTabs';
import { ProfileWidgets } from 'components/members/components/MemberProfile/components/ProfileWidgets/ProfileWidgets';
import type { Member } from 'lib/members/interfaces';
import type { PublicUser } from 'pages/api/public/profile/[userId]';

import { UserCredentialsList } from './UserCredentials/UserCredentialsList';
import { UserSpacesList } from './UserSpacesList/UserSpacesList';

export function ProfileTabs(props: {
  user: Member | PublicUser | LoggedInUser;
  readOnly?: boolean;
  showAllProfileTypes?: boolean;
}) {
  const { readOnly } = props;

  const [activeTab, setActiveTab] = useState(0);

  const tabs: TabConfig[] = useMemo(() => {
    const _tabs = [
      [
        'Profile',
        <ProfileWidgets
          showAllProfileTypes={props.showAllProfileTypes}
          setActiveTab={setActiveTab}
          key='profile'
          readOnly={readOnly}
          userId={props.user.id}
        />,
        { sx: { px: 0 } }
      ],
      [
        'Organizations',
        <Stack key='organizations'>
          <UserSpacesList userId={props.user.id} />
        </Stack>,
        { sx: { px: 0 } }
      ],
      ['Credentials', <UserCredentialsList key='credentials' userId={props.user.id} />, { sx: { px: 0 } }]
    ];

    return _tabs as TabConfig[];
  }, [readOnly, props.user.id]);

  return <MultiTabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />;
}
