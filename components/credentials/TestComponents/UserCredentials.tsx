import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { TextInput } from 'components/common/BoardEditor/components/properties/TextInput';
import { useGetUserCredentials } from 'components/settings/credentials/hooks/credentialHooks';

import { ProposalCredentialCard } from './ProposalCredentialCard';

export function UserCredentials({ account }: { account: string }) {
  const [selectedAccount, setSelectedAccount] = useState(account);

  const { data: credentials, isLoading } = useGetUserCredentials({ account: selectedAccount });

  return (
    <div>
      <Typography variant='h3'>Received Credentials</Typography>

      <TextInput onChange={setSelectedAccount} />

      {isLoading && <Typography>Loading...</Typography>}

      {credentials?.map((credential) => (
        <ProposalCredentialCard key={credential.id} credential={credential} />
      ))}
    </div>
  );
}
