import type { Space } from '@charmverse/core/prisma-client';
import { Alert, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import { useDocusign } from 'components/signing/hooks/useDocusign';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useSnackbar } from 'hooks/useSnackbar';

import { IntegrationContainer } from '../IntegrationContainer';

export function DocumentSettings({ isAdmin }: { isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { docusignProfile, connectDocusignAccount, disconnectDocusign } = useDocusign();

  const router = useRouter();

  const { updateURLQuery } = useCharmRouter();

  const { showMessage } = useSnackbar();

  useEffect(() => {
    if (router.query.docusignError) {
      showMessage(router.query.docusignError as string, 'error');
      updateURLQuery({ ...router.query, docusignError: undefined });
    }
  }, [router.query.docusignError]);

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
      <Stack spacing={2}>
        <Typography variant='body2'>
          Connect your Docusign account and allow users to sign documents inside CharmVerse.
        </Typography>
        <Alert severity='info' sx={{ width: 'fit-content' }}>
          The connected Docusign user should be an admin of your company Docusign account.
        </Alert>
        {docusignProfile ? (
          <Button onClick={disconnectDocusign} color='error' variant='outlined' sx={{ width: 'fit-content' }}>
            Disconnect
          </Button>
        ) : (
          <Button onClick={connectDocusignAccount} color='primary' sx={{ width: 'fit-content' }}>
            Connect Docusign
          </Button>
        )}
      </Stack>
    </IntegrationContainer>
  );
}
