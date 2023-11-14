import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
import { Chip, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { isProdEnv } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';

const collablandStoreUrl = isProdEnv ? 'https://cc.collab.land/dashboard' : 'https://cc-qa.collab.land/dashboard';

export function ConnectCollabland() {
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const [isConnecting, setIsConnecting] = useState(false);
  const { showMessage } = useSnackbar();

  const redirectToCollablandStore = async () => {
    if (!space) return;

    setIsConnecting(true);
    try {
      const { code } = await charmClient.spaces.getCollablandCode(space.id);

      window.location.href = `${collablandStoreUrl}?cv_state=${code}`;
    } catch (error) {
      showMessage('Error connecting to Collabland. Please try again.', 'error');
    }
  };

  if (space?.discordServerId) {
    return (
      <Stack>
        <FieldWrapper label='Connected discord server id'>
          <Stack direction='row' alignItems='center' gap={1} flex={1}>
            <TextField disabled value={space.discordServerId} sx={{ flex: 1 }} />
            <Chip size='small' label='Connected' color='success' icon={<CheckCircleOutlineOutlined />} />
          </Stack>
        </FieldWrapper>
        {isAdmin && (
          <Stack>
            <Button
              sx={{
                width: 'fit-content'
              }}
              target='_blank'
              external
              href={collablandStoreUrl}
            >
              Disconnect
            </Button>
          </Stack>
        )}
      </Stack>
    );
  }

  if (!isAdmin) {
    return (
      <Typography variant='body2'>Collabland is not connected yet. Only space admins can configure this.</Typography>
    );
  }

  return (
    <Stack>
      <Stack direction='row' gap={2} justifyContent='space-between' alignItems='center'>
        <Typography variant='body2'>
          To connect your space with collabland you will need to install mini app in Collabland's marketplace
        </Typography>

        <Stack>
          <Button onClick={redirectToCollablandStore} loading={isConnecting}>
            Connect
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
