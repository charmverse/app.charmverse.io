import Typography from '@mui/material/Typography';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useGetUserCredentials } from 'components/settings/credentials/hooks/credentialHooks';

import { ProposalCredentialCard } from './ProposalCredentialCard';

export function UserCredentials({ account }: { account: string }) {
  const { data: credentials, isLoading } = useGetUserCredentials({ account });

  return (
    <div>
      <Typography variant='h3'>Received Credentials</Typography>

      {isLoading && <Typography>Loading...</Typography>}

      {credentials?.map((credential) => (
        <ProposalCredentialCard key={credential.id} credential={credential} />
      ))}
    </div>
  );
}
