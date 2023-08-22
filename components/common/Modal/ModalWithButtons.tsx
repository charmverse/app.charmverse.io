import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';
import type { ModalProps } from 'components/common/Modal';
import { Modal } from 'components/common/Modal';

type Props = Pick<ModalProps, 'onClose' | 'open' | 'size'> & {
  children: ReactNode;
  buttonText?: string;
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
      <Box sx={{ columnSpacing: 2, mt: 3, display: 'flex' }}>
        <Button
          color='primary'
          sx={{
            mr: 2,
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
        {!hideCancelButton && (
          <Button color='secondary' variant='outlined' onClick={onClose}>
            {secondaryButtonText}
          </Button>
        )}
      </Box>
    </Modal>
  );
}
