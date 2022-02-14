import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import getDisplayName from 'lib/users/getDisplayName';
import Avatar from 'components/settings/LargeAvatar';
import Legend from 'components/settings/Legend';
import { setTitle } from 'hooks/usePageTitle';
import { useUser } from 'hooks/useUser';
import WalletConnection from 'components/settings/WalletConnection';

export default function AccountSettings () {

  setTitle('My Account');
  const [user, setUser] = useUser();

  return (
    <Grid container direction='column' spacing={3}>
      <Grid item>
        <Box sx={{ py: 3 }}>
          <Avatar name={user ? getDisplayName(user) : ''} />
        </Box>
      </Grid>
      <Grid item>
        <Legend>Web3 Connection</Legend>
        <WalletConnection />
      </Grid>
    </Grid>
  );
}

AccountSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
