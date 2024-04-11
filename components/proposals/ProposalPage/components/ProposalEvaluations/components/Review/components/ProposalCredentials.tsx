import { Divider, FormLabel } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useGetIssuedProposalCredentials } from 'charmClient/hooks/proposals';
import { IssueProposalCredentials } from 'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/components/IssueProposalCredentials';
import LoadingComponent from 'components/common/LoadingComponent';
import { CredentialSelect } from 'components/credentials/CredentialsSelect';
import { UserCredentialRow } from 'components/members/components/MemberProfile/components/UserCredentials/UserCredentialRow';
import { useProposalCredentials } from 'components/proposals/hooks/useProposalCredentials';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

const preventAccordionToggle = (e: any) => e.stopPropagation();

export function ProposalCredentials({
  selectedCredentialTemplates,
  proposalId
}: {
  selectedCredentialTemplates: string[];
  proposalId: string;
}) {
  const { issuedCredentials, isLoadingIssuedCredentials, issuableProposalCredentials } = useProposalCredentials({
    proposalId
  });
  const { space } = useCurrentSpace();
  return (
    <Box display='flex' flexDirection='column' gap={2} onClick={preventAccordionToggle}>
      <Typography variant='body2'>
        Issue credentials to proposal authors for passing the proposal review process
      </Typography>
      <CredentialSelect readOnly templateType='proposal' selectedCredentialTemplates={selectedCredentialTemplates} />

      {space?.useOnchainCredentials && space.credentialsWallet && issuableProposalCredentials?.length ? (
        <Box width='fit-content'>
          <IssueProposalCredentials selectedPageIds={[proposalId]} />
        </Box>
      ) : null}

      {isLoadingIssuedCredentials && !issuedCredentials && <LoadingComponent />}
      {!isLoadingIssuedCredentials && !issuedCredentials?.length && (
        <Typography>No credentials issued for this proposal</Typography>
      )}
      {issuedCredentials?.length && (
        <Stack gap={1.5}>
          <FormLabel>
            <Typography variant='subtitle1'>Issued Credentials</Typography>
          </FormLabel>
          {issuedCredentials.map((c) => (
            <UserCredentialRow hideFavourite credential={c} key={c.id} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
