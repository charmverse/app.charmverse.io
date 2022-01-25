import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import Legend from 'components/settings/Legend';
import Typography from '@mui/material/Typography';

interface FormValues {
  domain: string;
  name: string;
}

export default function MembersSettings () {

  return (<>
    <Legend>Invite Links</Legend>
    <Typography color='secondary'>No invite links yet</Typography>

    <Legend>Token Gates</Legend>
    <Typography color='secondary'>No token gates yet</Typography>

    <Legend>Current Members</Legend>
  </>);

}

MembersSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};