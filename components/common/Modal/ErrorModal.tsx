import { ComponentProps } from 'react';
import Alert from '@mui/material/Alert';
import { Modal, DialogTitle } from './Modal';

export function ErrorModal ({ message, ...props }: { message: string } & Omit<ComponentProps<typeof Modal>, 'children'>) {
  return (
    <Modal size='fluid' {...props}>
      <DialogTitle onClose={props.onClose}>An error occurred</DialogTitle>
      <Alert severity='error'>{message}</Alert>
    </Modal>
  );
}
