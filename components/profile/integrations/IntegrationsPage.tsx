import { Divider, Typography } from '@mui/material';
import MultiSigList from './components/GnosisSafes';
import IdentityProviders from './components/IdentityProviders';

export default function MyIntegrations () {

  return (
    <>
      <Typography variant='h1' gutterBottom>Integrations</Typography>
      <IdentityProviders />
      <Divider sx={{ mt: 2, mb: 3 }} />
      <MultiSigList />
    </>
  );
}
