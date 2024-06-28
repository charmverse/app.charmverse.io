import type { Space } from '@charmverse/core/prisma-client';
import EditIcon from '@mui/icons-material/EditOutlined';
import { Alert, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { minWidth } from '@mui/system';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { ConfirmationModal } from 'components/_app/components/ConfirmationModal';
import { Button } from 'components/common/Button';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectField } from 'components/common/form/fields/SelectField';
import Link from 'components/common/Link';
import { useDocusign } from 'components/signing/hooks/useDocusign';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { UserDocusignAccountsInfo } from 'lib/docusign/getUserDocusignAccountsInfo';

import { IntegrationContainer } from '../IntegrationContainer';

function ConnectInfo() {
  return (
    <Typography variant='body2'>
      Running into Docusign Connect webhook errors? Follow{' '}
      <Link
        external
        target='_blank'
        href='https://support.docusign.com/s/articles/ERROR-This-Account-lacks-sufficient-permissions-Connect-not-enabled-for-account?language=en_US'
      >
        these steps
      </Link>{' '}
    </Typography>
  );
}

function SelectDocusignAccount({
  currentAccountId,
  accounts,
  onClick
}: {
  currentAccountId: string;
  accounts: UserDocusignAccountsInfo[];
  onClick: (accountId: string) => void;
}) {
  const { showConfirmation } = useConfirmationModal();

  async function handleAccountSelection(account: UserDocusignAccountsInfo) {
    const message = `Are you sure you want to switch to ${account.docusignAccountName}?\r\nAny existing proposals with linked Docusign documents will not be updated.`;

    const result = await showConfirmation(message);

    if (result.confirmed) {
      onClick(account.docusignAccountId);
    }
  }

  return (
    <Stack gap={1} my={2}>
      {accounts.map((account) => {
        const isCurrentAccount = account.docusignAccountId === currentAccountId;

        if (isCurrentAccount) {
          return null;
        }
        return (
          <Box key={account.docusignAccountId} display='flex' alignItems='center' justifyContent='space-between'>
            <Typography variant='body2' fontWeight='bold'>
              {account.docusignAccountName}
            </Typography>
            <Button
              onClick={() => handleAccountSelection(account)}
              variant='outlined'
              disabled={isCurrentAccount}
              size='small'
              color='secondary'
              sx={{
                minWidth: '130px'
              }}
            >
              {isCurrentAccount ? 'Connected' : 'Use this account'}
            </Button>
          </Box>
        );
      })}

      <ConnectInfo />

      <ConfirmationModal />
    </Stack>
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
            <Button onClick={disconnectDocusign} color='error' variant='outlined' sx={{ width: 'fit-content', mt: 2 }}>
              Disconnect
            </Button>
          </Box>
        ) : (
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
        )}
      </Stack>
    </IntegrationContainer>
  );
}
