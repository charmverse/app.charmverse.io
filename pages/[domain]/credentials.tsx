import getPageLayout from 'components/common/PageLayout/getLayout';
import { Typography } from 'components/common/Typography';
import { ProposalCredentialForm } from 'components/credentials/ProposalCredentialForm';
import { useWeb3Account } from 'hooks/useWeb3Account';

// Root attestation schema
// https://optimism.easscan.org/schema/view/0x20770d8c0a19668aa843240ddf6d57025334b346171c28dfed1a7ddb16928b89

export default function CredentialsPage() {
  return (
    <div>
      <Typography variant='h2'>Create an attestation</Typography>

      <ProposalCredentialForm />
    </div>
  );
}

CredentialsPage.getLayout = getPageLayout;
