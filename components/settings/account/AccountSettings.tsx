import { Box } from '@mui/material';

import { useTrackPageView } from 'charmClient/hooks/track';
import { DialogTitle } from 'components/common/Modal';
import { AccountPreferences } from 'components/settings/account/components/AccountPreferences';
import Legend from 'components/settings/Legend';

import { UserIdentities } from '../profile/components/IdentityModal';

import { MultiSigList } from './components/MultiSigList';
import { TwoFactorAuthUser } from './components/TwoFactorAuthUser';

export function AccountSettings() {
  useTrackPageView({ type: 'settings/my-account' });

  return (
    <>
      <Legend>My Account</Legend>
      <DialogTitle>Select a public identity</DialogTitle>
      <UserIdentities />
      <Box sx={{ mb: 2 }} />
      <AccountPreferences />
      <TwoFactorAuthUser />
      <MultiSigList />
    </>
  );
}
