import Switch from '@mui/material/Switch';
import { useState } from 'react';

import getPageLayout from 'components/common/PageLayout/getLayout';
import { Typography } from 'components/common/Typography';
import { ProposalCredentialForm } from 'components/credentials/ProposalCredentialForm';
import { UserCredentials } from 'components/credentials/UserCredentials';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';

// Root attestation schema
// https://optimism.easscan.org/schema/view/0x20770d8c0a19668aa843240ddf6d57025334b346171c28dfed1a7ddb16928b89

export default function CredentialsPage() {
  const [makeNewCredential, setMakeNewCredential] = useState(false);
  const { account } = useWeb3Account();

  const { user } = useUser();

  return (
    <div>
      <Typography variant='h2'>Credentials</Typography>
      <Switch onChange={() => setMakeNewCredential(!makeNewCredential)} value={makeNewCredential} />

      {makeNewCredential && <ProposalCredentialForm />}
      {!makeNewCredential && <UserCredentials account={user?.wallets[0].address as string} />}
    </div>
  );
}

CredentialsPage.getLayout = getPageLayout;
