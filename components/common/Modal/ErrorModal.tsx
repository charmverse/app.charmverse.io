import { ComponentProps } from 'react';
import Alert from '@mui/material/Alert';
import { Modal } from './Modal';

export function ErrorModal ({ message, ...props }: { message: string } & Omit<ComponentProps<typeof Modal>, 'children'>) {
  return (
    <Modal size='fluid' {...props}>
      <Alert severity='error'>{message}</Alert>
    </Modal>
  );
}
