import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';


export default function MembersSettings () {
  return (
    <>Member settings!</>
  );

}

MembersSettings.getLayout = (page: ReactElement) => {
  console.log('get members layout', page);
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};