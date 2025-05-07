import { Box, InputLabel } from '@mui/material';

import { useTrackPageView } from 'charmClient/hooks/track';
import { AccountPreferences } from 'components/settings/account/components/AccountPreferences';
import Legend from 'components/settings/components/Legend';

import { UserIdentities } from '../profile/components/IdentityModal';

import { MultiSigList } from './components/MultiSigList';
import { TwoFactorAuthUser } from './components/TwoFactorAuthUser';

export function AccountSettings() {
  useTrackPageView({ type: 'settings/my-account' });

  return (
    <>
      <Legend>My Account</Legend>
      <InputLabel sx={{ mb: 1 }}>Select your identity</InputLabel>
      <UserIdentities />
      <Box sx={{ mb: 2 }} />
      <AccountPreferences />
      <TwoFactorAuthUser />
      <MultiSigList />
    </>
  );
}
