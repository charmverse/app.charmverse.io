import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';

import getPageLayout from 'components/common/PageLayout/getLayout';
import { Typography } from 'components/common/Typography';
import { useWeb3Account } from 'hooks/useWeb3Account';

// Root attestation schema
// https://optimism.easscan.org/schema/view/0x20770d8c0a19668aa843240ddf6d57025334b346171c28dfed1a7ddb16928b89

export default function AttestPage() {
  const { account, signer } = useWeb3Account();
  return (
    <div>
      <Typography variant='h2'>Create an attestation</Typography>

      <InputLabel>Attest</InputLabel>
      <Input type='text' />
    </div>
  );
}

AttestPage.getLayout = getPageLayout;
