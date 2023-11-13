import { Stack } from '@mui/material';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { isProdEnv } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';

const collablandStoreUrl = isProdEnv ? 'https://cc.collab.land/dashboard' : 'https://cc-qa.collab.land/dashboard';

export function DisconnectCollabland() {
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { showMessage } = useSnackbar();

  const redirectToCollablandStore = async () => {
    if (!space) return;

    setIsDisconnecting(true);
    try {
      const { code } = await charmClient.spaces.getCollablandCode(space.id);

      window.location.href = `${collablandStoreUrl}?cv_state=${code}`;
    } catch (error) {
      showMessage('Error disconnecting from Collabland. Please try again.', 'error');
    }
  };

  if (!space?.discordServerId || !isAdmin) {
    return null;
  }

  return (
    <Stack>
      <Button onClick={redirectToCollablandStore} loading={isDisconnecting}>
        Disconnect
      </Button>
    </Stack>
  );
}
