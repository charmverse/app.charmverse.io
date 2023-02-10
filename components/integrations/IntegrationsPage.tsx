import { useEffect } from 'react';

import charmClient from 'charmClient';
import { AccountSettings } from 'components/settings/AccountSettings';

import MultiSigList from './components/GnosisSafes';
import IdentityProviders from './components/IdentityProviders';

export default function IntegrationSettings() {
  useEffect(() => {
    charmClient.track.trackAction('page_view', { type: 'integrations' });
  }, []);

  return (
    <>
      <AccountSettings />
      <IdentityProviders />
      <MultiSigList />
    </>
  );
}
