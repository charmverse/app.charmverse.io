import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function CustomRolesInfoModal({ isOpen, onClose }: Props) {
  const { openUpgradeSubscription } = useSettingsDialog();
  function clickHandler() {
    onClose();
    openUpgradeSubscription();
  }

  return (
    <Modal open={isOpen} onClose={onClose} title='Upgrade to access custom roles'>
      <Stack>
        <Typography variant='body2'>
          <ul style={{ marginLeft: '-20px' }}>
            <li>Invite guests with limited access to your space</li>
            <li>Provide greater or more restricted permissions to specific roles</li>
            <li>Allow users to gain roles via invite links and Token Gates</li>
            <li>Restrict access to pages, forum and proposal categories only to those that need to access them</li>
          </ul>
        </Typography>
        <Button onClick={clickHandler}>Upgrade now</Button>
      </Stack>
    </Modal>
  );
}
