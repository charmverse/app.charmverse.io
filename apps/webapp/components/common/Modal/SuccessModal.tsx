import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Box } from '@mui/material';
import type { ComponentProps } from 'react';

import { Modal, DialogTitle } from './Modal';

export default function SuccessModal({
  title,
  ...props
}: { title?: string } & Omit<ComponentProps<typeof Modal>, 'children'>) {
  return (
    <Modal size='fluid' {...props}>
      <DialogTitle onClose={props.onClose} sx={{ padding: 0 }}>
        <Box display='flex' gap={1} width={300} alignItems='center'>
          <CheckCircleOutlineIcon color='success' fontSize='large' />
          {typeof title === 'undefined' ? 'Success' : title}
        </Box>
      </DialogTitle>
    </Modal>
  );
}
