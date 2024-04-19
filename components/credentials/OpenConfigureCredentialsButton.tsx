import { Box, Tooltip } from '@mui/material';

import { Button } from 'components/common/Button';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

export function OpenConfigureCredentialsButton() {
  const isAdmin = useIsAdmin();

  const { openSettings } = useSettingsDialog();

  return (
    <Tooltip title='Admins can configure available credentials in this space'>
      <Box>
        <Button disabled={!isAdmin} variant='outlined' onClick={() => openSettings('credentials')}>
          Configure Credentials
        </Button>
      </Box>
    </Tooltip>
  );
}
