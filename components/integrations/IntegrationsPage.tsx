import MultiSigList from './components/GnosisSafes';
import IdentityProviders from './components/IdentityProviders';

export default function IntegrationSettings() {
  return (
    <>
      <IdentityProviders />
      <MultiSigList />
    </>
  );
}
