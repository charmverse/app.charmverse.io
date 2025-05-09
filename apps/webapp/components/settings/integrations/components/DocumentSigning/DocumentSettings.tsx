import { Alert, Divider, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import { useDocusign } from 'components/signing/hooks/useDocusign';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

import { IntegrationContainer } from '../IntegrationContainer';

import { ConnectInfo } from './ConnectInfo';
import { SelectAllowedRolesAndUsers } from './SelectAllowedRolesAndUsers';
import { SelectDocusignAccount } from './SelectDocusignAccount';

function ConnectedState({
  docusignProfile,
  availableDocusignAccounts,
  isAdmin,
  showSelectAccount,
  setShowSelectAccount,
  handleAccountSelection,
  disconnectDocusign
}: any) {
  return (
    <Box>
      <Box display='flex' alignItems='center' justifyContent='space-between'>
        <Typography variant='body2' display='flex' fontWeight='bold'>
          {docusignProfile.docusignAccountName}
        </Typography>
        {availableDocusignAccounts?.length && isAdmin && (
          <Button
            color='secondary'
            variant='outlined'
            onClick={() => setShowSelectAccount(!showSelectAccount)}
            sx={{ ml: 1, minWidth: '130px' }}
            size='small'
          >
            {showSelectAccount ? 'Cancel' : 'Change account'}
          </Button>
        )}
      </Box>
      {showSelectAccount && availableDocusignAccounts && (
        <SelectDocusignAccount
          currentAccountId={docusignProfile.docusignAccountId}
          accounts={availableDocusignAccounts}
          onClick={handleAccountSelection}
        />
      )}
      <Divider sx={{ height: '2px', my: 2 }} />
      <SelectAllowedRolesAndUsers />
      <Button onClick={disconnectDocusign} color='error' variant='outlined' sx={{ width: 'fit-content', mt: 2 }}>
        Disconnect
      </Button>
    </Box>
  );
}

function DisconnectedState({ connectDocusignAccount }: any) {
  return (
    <Box display='flex' flexDirection='column' gap={2}>
      <Typography variant='body2'>
        Connect your Docusign account and allow users to sign documents inside CharmVerse.
      </Typography>
      <Alert severity='info' sx={{ width: 'fit-content' }}>
        The connected Docusign user should be an admin of your company Docusign account.
      </Alert>

      <ConnectInfo />

      <Button onClick={connectDocusignAccount} color='primary' sx={{ width: 'fit-content' }}>
        Connect Docusign
      </Button>
    </Box>
  );
}

export function DocumentSettings({ isAdmin }: { isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const {
    docusignProfile,
    connectDocusignAccount,
    disconnectDocusign,
    availableDocusignAccounts,
    updateSelectedDocusignAccount
  } = useDocusign();

  const router = useRouter();

  const { space } = useCurrentSpace();

  const { updateURLQuery } = useCharmRouter();

  const { showMessage } = useSnackbar();

  const [showSelectAccount, setShowSelectAccount] = useState(false);

  useEffect(() => {
    if (router.query.docusignError) {
      showMessage(router.query.docusignError as string, 'error');
      updateURLQuery({ ...router.query, docusignError: undefined });
    }
  }, [router.query.docusignError]);

  async function handleAccountSelection(accountId: string) {
    try {
      await updateSelectedDocusignAccount({ spaceId: space?.id as string, docusignAccountId: accountId });
    } catch (err: any) {
      showMessage(err.message ?? 'Failed to update Docusign account', 'error');
    }
  }

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
        {docusignProfile ? (
          <ConnectedState
            docusignProfile={docusignProfile}
            availableDocusignAccounts={availableDocusignAccounts}
            isAdmin={isAdmin}
            showSelectAccount={showSelectAccount}
            setShowSelectAccount={setShowSelectAccount}
            handleAccountSelection={handleAccountSelection}
            disconnectDocusign={disconnectDocusign}
          />
        ) : (
          <DisconnectedState connectDocusignAccount={connectDocusignAccount} />
        )}
      </Stack>
    </IntegrationContainer>
  );
}
