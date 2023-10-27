import { Box } from '@mui/material';

import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

import { Button } from '../Button';
import Modal from '../Modal';
import { Typography } from '../Typography';

export function SpaceBanModal({ open, onClose }: { onClose: VoidFunction; open: boolean }) {
  const { user } = useUser();
  const { spaces } = useSpaces();

  return (
    <Modal title='You have been banned from this space' open={open} onClose={onClose}>
      <Typography>
        You have been banned from this space. You can't join it. If you think this is a mistake, please contact the
        space admins.
      </Typography>

      <Box gap={2} sx={{ maxWidth: '200px', display: 'flex', flexDirection: 'row', pt: 2 }}>
        {user &&
          (spaces?.length ? (
            <Button sx={{ width: '100%' }} href={`/${spaces[0].domain}`} color='primary'>
              Go to my space
            </Button>
          ) : (
            <Button sx={{ width: '100%' }} href='/createSpace' color='primary'>
              Create a space
            </Button>
          ))}
      </Box>
    </Modal>
  );
}
