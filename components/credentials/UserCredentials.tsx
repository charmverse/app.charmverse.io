import Typography from '@mui/material/Typography';
import useSWR from 'swr';

import charmClient from 'charmClient';

import { ProposalCredentialCard } from './ProposalCredentialCard';

export function UserCredentials({ account }: { account: string }) {
  const { data: credentials, isLoading } = useSWR(`credentials-${account}`, () =>
    charmClient.credentials.getUserCredentials({ account })
  );

  console.log('Fetched credentials for ', account, credentials);

  return (
    <div>
      <Typography variant='h3'>Received Credentials</Typography>

      {isLoading && <Typography>Loading...</Typography>}

      {/* {credentials?.map((credential: any) => (
        <p key={JSON.stringify(credential)}>{JSON.stringify(credential)}</p>
      ))} */}
    </div>
  );
}
