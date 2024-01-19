import { useTrackPageView } from 'charmClient/hooks/track';
import { AccountPreferences } from 'components/settings/account/components/AccountPreferences';
import Legend from 'components/settings/Legend';

import { IdentityProviders } from './components/IdentityProviders';
import { MultiSigList } from './components/MultiSigList';
import { TwoFactorAuthUser } from './components/TwoFactorAuthUser';

export function AccountSettings() {
  useTrackPageView({ type: 'settings/my-account' });

  return (
    <>
      <Legend>My Account</Legend>
      <IdentityProviders />
      <AccountPreferences />
      <TwoFactorAuthUser />
      <MultiSigList />
    </>
  );
}
