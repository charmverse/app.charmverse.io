import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';


export default function WorkspaceSettings () {
  return (
    <>Workspace settings!</>
  );

}

WorkspaceSettings.getLayout = (page: ReactElement) => {
  console.log('get settings layout', page);
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};