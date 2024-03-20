import { Box, Chip, Stack, Tooltip } from '@mui/material';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { Typography } from 'components/common/Typography';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import type { EasSchemaChain } from 'lib/credentials/connectors';
import { multiAttestOnchain } from 'lib/credentials/multiAttestOnchain';
import { lowerCaseEqual } from 'lib/utils/strings';

import { useGetIssuableProposalCredentials } from '../hooks/useGetIssuableProposalCredentials';

export function IssuableProposalCredentials() {
  const { space } = useCurrentSpace();

  const { issuableProposalCredentials } = useGetIssuableProposalCredentials({ spaceId: space?.id });

  const [indexing, setIndexing] = useState(false);
  const [signingCredential, setSigningCredential] = useState(false);

  const { account } = useWeb3Account();
  const { signer } = useWeb3Signer();

  const disableIssueCredentials =
    !account || !issuableProposalCredentials?.length || !lowerCaseEqual(space?.credentialsWallet, account);

  async function handleIssueCredentials() {
    setSigningCredential(true);
    const result = await multiAttestOnchain({
      chainId: space?.credentialsChainId as EasSchemaChain,
      type: 'proposal',
      signer,
      credentialInputs: (issuableProposalCredentials ?? [])
        ?.map((ic) => ({
          recipient: ic.recipientAddress,
          data: ic.credential
        }))
        .slice(0, 3)
    });
    setSigningCredential(false);
    setIndexing(true);
  }

  return (
    <Stack>
      {issuableProposalCredentials?.length === 0 && <div>No credentials to issue</div>}
      {issuableProposalCredentials?.length && (
        <div>
          Issuable credentials {issuableProposalCredentials?.length}
          <Tooltip
            title={
              disableIssueCredentials
                ? `You must be connected with wallet ${space?.credentialsWallet} to issue onchain credentials for this space`
                : ''
            }
          >
            <Box>
              <Button loading={indexing} onClick={handleIssueCredentials} disabled={disableIssueCredentials}>
                {indexing ? 'Saving credentials' : 'Issue credentials'}
              </Button>
            </Box>
          </Tooltip>
        </div>
      )}
      <Box sx={{ overflowY: 'scroll', maxHeight: '100px' }}>
        {issuableProposalCredentials?.map((credential) => (
          <div
            key={
              credential.credentialTemplateId +
              credential.recipientUserId +
              credential.credential.Event +
              credential.proposalId
            }
          >
            <Chip label={credential.credential.Event} />
            <div>{credential.credential.URL}</div>
          </div>
        ))}
      </Box>
    </Stack>
  );
}
