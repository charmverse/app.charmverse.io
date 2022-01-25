import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';


export default function AccountSettings () {
  return (
    <>Member settings!</>
  );

}

AccountSettings.getLayout = (page: ReactElement) => {
  console.log('get account layout', page);
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};