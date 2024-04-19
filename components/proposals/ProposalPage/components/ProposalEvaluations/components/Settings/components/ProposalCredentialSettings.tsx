import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { CredentialSelect } from 'components/credentials/CredentialsSelect';

export function ProposalCredentialSettings({
  selectedCredentialTemplates,
  setSelectedCredentialTemplates,
  readOnly
}: {
  selectedCredentialTemplates: string[];
  setSelectedCredentialTemplates: (templates: string[]) => void;
  readOnly: boolean;
}) {
  return (
    <Box display='flex' flexDirection='column' gap={2}>
      <Typography variant='body2'>
        Issue credentials to proposal authors for creating proposals or passing the proposal review process
      </Typography>
      <CredentialSelect
        readOnly={readOnly}
        onChange={(templateIds) => setSelectedCredentialTemplates(templateIds)}
        templateType='proposal'
        selectedCredentialTemplates={selectedCredentialTemplates}
      />
    </Box>
  );
}
