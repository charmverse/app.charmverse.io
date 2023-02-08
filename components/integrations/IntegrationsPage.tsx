import { useEffect } from 'react';

import charmClient from 'charmClient';

import MultiSigList from './components/GnosisSafes';
import IdentityProviders from './components/IdentityProviders';

export default function IntegrationSettings() {
  useEffect(() => {
    charmClient.track.trackAction('page_view', { type: 'integrations' });
  }, []);

  return (
    <>
      <IdentityProviders />
      <MultiSigList />
    </>
  );
}
