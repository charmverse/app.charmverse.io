import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Box, List, ListItem, Stack, TextField, Typography } from '@mui/material';
import { isProdEnv } from '@packages/config/constants';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

import { IntegrationContainer } from '../IntegrationContainer';

const collablandStoreUrl = isProdEnv ? 'https://cc.collab.land/dashboard' : 'https://cc-qa.collab.land/dashboard';

export function CollabLandSettings({ isAdmin }: { isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { space } = useCurrentSpace();
  const [isConnecting, setIsConnecting] = useState(false);
  const { showMessage } = useSnackbar();
  const disconnectPopup = usePopupState({ variant: 'popover', popupId: 'disconnect-collabland' });

  const isConnected = !!space?.discordServerId;

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

  return (
    <IntegrationContainer
      title='Collab.Land'
      subheader='Sync members and roles with Discord'
      expanded={expanded}
      setExpanded={setExpanded}
      isAdmin={isAdmin}
      isConnected={isConnected}
    >
      {isConnected ? (
        <Stack gap={2}>
          <FieldWrapper label='Discord server ID'>
            <TextField disabled value={space.discordServerId} />
          </FieldWrapper>
          <div>
            <Button color='error' variant='outlined' onClick={disconnectPopup.open}>
              Disconnect
            </Button>
          </div>

          <ConfirmDeleteModal
            title='Disconnect Collab.Land'
            onClose={disconnectPopup.close}
            open={disconnectPopup.isOpen}
            buttonText='Visit Collab.Land'
            buttonIcon={<LaunchIcon />}
            question={
              <List dense sx={{ mt: -1, mx: 2, listStyleType: 'disc', listStylePosition: 'outside' }}>
                {[
                  'You will visit CollabLand Command Center',
                  'Click Uninstall on the CharmVerse plugin you have installed',
                  'CollabLand roles will no longer be synced'
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
      ) : (
        <Stack gap={2}>
          <Typography variant='body2'>
            To connect your space with Collab.Land, you will need to install our mini-app in their marketplace.
          </Typography>
          <List dense sx={{ my: 0, mx: 2, p: 0, listStyleType: 'numeral', listStylePosition: 'outside' }}>
            {[
              'Visit CollabLand Command Center',
              'Login with your Discord Account',
              'Install the CharmVerse plugin'
            ].map((step) => (
              <ListItem key={step} sx={{ px: 1, display: 'list-item' }}>
                <Typography variant='body2'>{step}</Typography>
              </ListItem>
            ))}
          </List>
          <div>
            <Button loading={isConnecting} endIcon={<LaunchIcon />} onClick={redirectToCollablandStore}>
              Visit Collab.Land
            </Button>
          </div>
        </Stack>
      )}
    </IntegrationContainer>
  );
}
