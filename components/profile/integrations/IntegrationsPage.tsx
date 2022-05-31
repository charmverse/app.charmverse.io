
import MultiSigList from './components/GnosisSafes';
import IdentityProviders from './components/IdentityProviders';
import NexusPageTitle from '../components/NexusPageTitle';

export default function MyIntegrations () {

  return (
    <>
      <NexusPageTitle subPage='Integrations' />
      <IdentityProviders />
      <MultiSigList />
    </>
  );
}
