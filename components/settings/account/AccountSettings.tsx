import { useEffect } from 'react';

import charmClient from 'charmClient';
import { AccountPreferences } from 'components/settings/account/components/AccountPreferences';
import Legend from 'components/settings/Legend';

import { IdentityProviders } from './components/IdentityProviders';
import { MultiSigList } from './components/MultiSigList';

export function AccountSettings() {
  useEffect(() => {
    charmClient.track.trackAction('page_view', { type: 'integrations' });
  }, []);

  return (
    <>
      <Legend>My Account</Legend>
      <IdentityProviders />
      <AccountPreferences />
      <MultiSigList />
    </>
  );
}
