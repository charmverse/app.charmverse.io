import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import type { ReactNode } from 'react';

import type { ModalProps } from './Modal';
import { Modal } from './Modal';

type Props = Pick<ModalProps, 'open' | 'size'> & {
  children: ReactNode;
  buttonText?: string;
  loading?: boolean;
  title?: string;
  onConfirm: () => Promise<void> | void;
  secondaryButtonText?: string;
  onClose: () => void;
  disabled?: boolean;
  hideCancelButton?: boolean;
};

export default function ModalWithButtons({
  onClose,
  open,
  children,
  buttonText = 'Update',
  title,
  onConfirm,
  loading,
  size,
  secondaryButtonText = 'Cancel',
  disabled,
  hideCancelButton
}: Props) {
  async function _onConfirm() {
    await onConfirm();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size={size}>
      {children}
      <Box sx={{ gap: 2, mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        {!hideCancelButton && (
          <Button color='secondary' variant='outlined' onClick={onClose} data-test='modal-cancel-button'>
            {secondaryButtonText}
          </Button>
        )}
        <Button
          data-test='modal-confirm-button'
          color='primary'
          sx={{
            mr: 0.5,
            fontWeight: 'bold',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onClick={_onConfirm}
          disabled={disabled}
        >
          {buttonText}
        </Button>
      </Box>
    </Modal>
  );
}
