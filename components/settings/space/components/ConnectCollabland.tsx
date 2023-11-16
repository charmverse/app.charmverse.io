import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
import { Chip, List, ListItem, Stack, TextField, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
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
  const connectCollablandModalState = usePopupState({ variant: 'popover', popupId: 'connect-collabland' });
  const disconnectCollablandModalState = usePopupState({ variant: 'popover', popupId: 'disconnect-collabland' });
  const redirectToCollablandStore = async () => {
    if (!space) return;

    setIsConnecting(true);
    try {
      const { code } = await charmClient.spaces.getCollablandCode(space.id);
      window.open(`${collablandStoreUrl}?cv_state=${code}`, '_blank');
    } catch (error) {
      showMessage('Error connecting to Collabland. Please try again.', 'error');
    } finally {
      setIsConnecting(false);
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
              onClick={disconnectCollablandModalState.open}
              sx={{
                width: 'fit-content'
              }}
            >
              Disconnect
            </Button>
            <ConfirmDeleteModal
              title='Disconnect CollabLand'
              onClose={disconnectCollablandModalState.close}
              open={disconnectCollablandModalState.isOpen}
              buttonText='Disconnect'
              primaryButtonColor='primary'
              question={
                <List dense sx={{ mt: -1, mx: 2, listStyleType: 'disc', listStylePosition: 'outside' }}>
                  {[
                    'You will visit CollabLand Command Center',
                    'Click Uninstall on the CharmVerse plugin you have installed',
                    'CollabLand roles will be deleted and no longer synced'
                  ].map((step) => (
                    <ListItem key={step} sx={{ px: 0, display: 'list-item' }}>
                      <Typography variant='body2'>{step}</Typography>
                    </ListItem>
                  ))}
                </List>
              }
              onConfirm={() => {
                window.open(collablandStoreUrl, '_blank');
              }}
            />
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
          <Button onClick={connectCollablandModalState.open} loading={isConnecting}>
            Connect
          </Button>
        </Stack>
      </Stack>
      <ConfirmDeleteModal
        title='Connect CollabLand'
        onClose={connectCollablandModalState.close}
        open={connectCollablandModalState.isOpen}
        buttonText='Connect'
        primaryButtonColor='primary'
        question={
          <List dense sx={{ mt: -1, mx: 2, listStyleType: 'disc', listStylePosition: 'outside' }}>
            {[
              'You will visit CollabLand Command Center',
              'Connect your Discord Account',
              'Install one of the CharmVerse plugin',
              'Return to your CharmVerse space and your roles will be synced'
            ].map((step) => (
              <ListItem key={step} sx={{ px: 0, display: 'list-item' }}>
                <Typography variant='body2'>{step}</Typography>
              </ListItem>
            ))}
          </List>
        }
        onConfirm={() => {
          redirectToCollablandStore();
        }}
      />
    </Stack>
  );
}
