import type { ButtonProps } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';
import type { ModalProps } from 'components/common/Modal';
import { Modal } from 'components/common/Modal';

type Props = Pick<ModalProps, 'onClose' | 'open' | 'size'> & {
  question: string | ReactNode;
  loading?: boolean;
  buttonText?: string;
  buttonIcon?: ReactNode;
  title?: string;
  onConfirm: () => Promise<void> | void;
  secondaryButtonText?: string;
  onClose: () => void;
  disabled?: boolean;
  primaryButtonColor?: ButtonProps['color'];
};

export default function ConfirmDeleteModal({
  onClose,
  open,
  question,
  loading,
  buttonText = 'Delete',
  buttonIcon,
  title,
  onConfirm,
  size,
  secondaryButtonText = 'Cancel',
  disabled,
  primaryButtonColor = 'error'
}: Props) {
  async function _onConfirm() {
    await onConfirm();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size={size}>
      {typeof question === 'string' ? <Typography>{question}</Typography> : question}
      <Box display='flex' justifyContent='flex-end' mt={3} gap={2}>
        <Button color='secondary' variant='outlined' onClick={onClose}>
          {secondaryButtonText}
        </Button>
        <Button
          color={primaryButtonColor}
          sx={{
            fontWeight: 'bold'
            // not sure why we needed to clip the labels
            // display: 'block',
            // overflow: 'hidden',
            // textOverflow: 'ellipsis'
          }}
          endIcon={buttonIcon}
          loading={loading}
          data-testid='confirm-delete-button'
          onClick={_onConfirm}
          disabled={disabled || loading}
        >
          {buttonText}
        </Button>
      </Box>
    </Modal>
  );
}
