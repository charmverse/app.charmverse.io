import Alert from '@mui/material/Alert';
import type { ComponentProps } from 'react';

import { Modal, DialogTitle } from './Modal';

export default function ErrorModal({
  message,
  title,
  ...props
}: { message: string; title?: string } & Omit<ComponentProps<typeof Modal>, 'children'>) {
  return (
    <Modal size='fluid' {...props}>
      <DialogTitle onClose={props.onClose}>{typeof title === 'undefined' ? 'An error occurred' : title}</DialogTitle>
      <Alert severity='error'>{message}</Alert>
    </Modal>
  );
}
