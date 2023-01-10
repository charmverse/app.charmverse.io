import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Button from 'components/common/Button';
import Link from 'components/common/Link';
import { Modal } from 'components/common/Modal';
import { charmverseDiscordInvite } from 'config/constants';

type Props = {
  onClose: () => void;
  open: boolean;
};

export function LoginErrorModal({ onClose, open }: Props) {
  return (
    <Modal title='Login error' open={open} onClose={onClose}>
      <Stack mb={2} spacing={2}>
        <Typography variant='body1'>There was a problem with your account.</Typography>
        <Typography variant='body1'>
          Please contact our support on{' '}
          <Link external href={charmverseDiscordInvite}>
            Discord
          </Link>
        </Typography>
      </Stack>
      <Button onClick={onClose}>Close</Button>
    </Modal>
  );
}
