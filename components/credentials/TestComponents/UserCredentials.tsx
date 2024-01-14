import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { useGetUserCredentials } from 'components/settings/credentials/hooks/credentialHooks';
import { shortWalletAddress } from 'lib/utilities/blockchain';

import { ProposalCredentialCard } from './ProposalCredentialCard';

export function UserCredentials({ account }: { account: string }) {
  const [selectedAccount, setSelectedAccount] = useState(account);

  const { data: credentials, isLoading } = useGetUserCredentials({ account: selectedAccount });

  return (
    <div>
      <TextField
        variant='outlined'
        fullWidth
        label='Recipient address'
        defaultValue={account}
        onChange={(ev) => setSelectedAccount(ev.target.value)}
      />

      {isLoading && <Typography>Loading...</Typography>}

      <Typography variant='h4'>Credentials for {shortWalletAddress(selectedAccount)}</Typography>
      {credentials?.map((credential) => (
        <ProposalCredentialCard key={credential.id} credential={credential} />
      ))}
    </div>
  );
}
