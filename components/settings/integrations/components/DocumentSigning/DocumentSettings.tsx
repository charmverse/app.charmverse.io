import type { Space } from '@charmverse/core/prisma-client';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { useDocusign } from 'components/signing/hooks/useDocusign';

import { IntegrationContainer } from '../IntegrationContainer';

export function DocumentSettings({ isAdmin }: { isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { docusignProfile, connectDocusignAccount, disconnectDocusign } = useDocusign();

  return (
    <IntegrationContainer
      title='Documents'
      subheader='Connect Docusign to your account'
      expanded={expanded}
      setExpanded={setExpanded}
      isAdmin={isAdmin}
      isConnected={!!docusignProfile}
      onCancel={() => setExpanded(false)}
    >
      <Box>
        <Stack direction='row' spacing={2}>
          {docusignProfile ? (
            <Button onClick={disconnectDocusign} color='error' variant='outlined'>
              Disconnect
            </Button>
          ) : (
            <Button onClick={connectDocusignAccount} color='primary'>
              Connect Docusign
            </Button>
          )}
        </Stack>
      </Box>
    </IntegrationContainer>
  );
}
