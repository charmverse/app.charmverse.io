import { Divider } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useGetIssuedProposalCredentials } from 'charmClient/hooks/proposals';
import { IssueProposalCredentials } from 'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/components/IssueProposalCredentials';
import LoadingComponent from 'components/common/LoadingComponent';
import { CredentialSelect } from 'components/credentials/CredentialsSelect';
import { UserCredentialRow } from 'components/members/components/MemberProfile/components/UserCredentials/UserCredentialRow';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export function ProposalCredentials({
  readOnly,
  selectedCredentialTemplates,
  setSelectedCredentialTemplates,
  proposalId
}: {
  selectedCredentialTemplates: string[];
  setSelectedCredentialTemplates?: (templates: string[]) => void;
  readOnly?: boolean;
  proposalId: string;
}) {
  const { data: issuedCredentials, isLoading: isLoadingIssuedCredentials } = useGetIssuedProposalCredentials({
    proposalId
  });
  const { space } = useCurrentSpace();
  return (
    <Box display='flex' flexDirection='column' gap={2}>
      <Typography variant='body2'>
        Issue credentials to proposal authors for passing the proposal review process
      </Typography>
      <CredentialSelect
        readOnly={readOnly}
        onChange={setSelectedCredentialTemplates}
        templateType='proposal'
        selectedCredentialTemplates={selectedCredentialTemplates}
      />

      {space?.useOnchainCredentials && space.credentialsWallet && (
        <IssueProposalCredentials selectedPageIds={[proposalId]} />
      )}

      {isLoadingIssuedCredentials && !issuedCredentials && <LoadingComponent />}
      {!isLoadingIssuedCredentials && !issuedCredentials?.length && (
        <Typography>No credentials issued for this proposal</Typography>
      )}
      {issuedCredentials?.length && (
        <Stack>
          <Divider sx={{ mb: 2 }} />
          {issuedCredentials.map((c) => (
            <UserCredentialRow hideFavourite credential={c} key={c.id} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
