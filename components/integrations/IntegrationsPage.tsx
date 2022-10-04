
import NexusPageTitle from 'components/nexus/components/NexusPageTitle';

import MultiSigList from './components/GnosisSafes';
import IdentityProviders from './components/IdentityProviders';

export default function MyIntegrations () {

  return (
    <>
      <NexusPageTitle subPage='Integrations' />
      <IdentityProviders />
      <MultiSigList />
    </>
  );
}
