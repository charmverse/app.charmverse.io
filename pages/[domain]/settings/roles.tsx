import SettingsLayout from 'components/settings/Layout';
import type { ReactElement } from 'react';
import { setTitle } from 'hooks/usePageTitle';
import RoleAssignment from 'components/settings/roles/RoleSettings';

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
