import type { ReactElement } from 'react';

import SettingsLayout from 'components/settings/Layout';
import RoleAssignment from 'components/settings/roles/RoleSettings';
import { setTitle } from 'hooks/usePageTitle';

export default function RoleSettings () {
  setTitle('Roles & Permissions');
  return (
    <RoleAssignment />
  );
}

RoleSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
