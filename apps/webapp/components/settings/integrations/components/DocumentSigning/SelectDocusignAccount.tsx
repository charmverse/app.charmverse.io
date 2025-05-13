import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { Button } from 'components/common/Button';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import type { UserDocusignAccountsInfo } from '@packages/lib/docusign/getUserDocusignAccountsInfo';

import { ConnectInfo } from './ConnectInfo';

export function SelectDocusignAccount({
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

    const result = await showConfirmation({
      title: 'Confirm Docusign account switch',
      message
    });

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
    </Stack>
  );
}
