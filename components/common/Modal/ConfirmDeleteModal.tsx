import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import Button from 'components/common/Button';
import type { ModalProps } from 'components/common/Modal';
import { Modal } from 'components/common/Modal';

type Props = Pick<ModalProps, 'onClose' | 'open' | 'size'> & {
  question: string | ReactNode;
  buttonText?: string;
  title?: string;
  onConfirm: () => void;
  secondaryButtonText?: string;
  onClose: () => void;
};

export default function ConfirmDeleteModal({
  onClose,
  open,
  question,
  buttonText = 'Delete',
  title,
  onConfirm,
  size,
  secondaryButtonText = 'Cancel'
}: Props) {
  function _onConfirm() {
    onConfirm();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size={size}>
      {typeof question === 'string' ? <Typography>{question}</Typography> : question}

      <Box sx={{ columnSpacing: 2, mt: 3, display: 'flex' }}>
        <Button
          color='error'
          sx={{
            mr: 2,
            fontWeight: 'bold',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onClick={_onConfirm}
        >
          {buttonText}
        </Button>

        <Button color='secondary' variant='outlined' onClick={onClose}>
          {secondaryButtonText}
        </Button>
      </Box>
    </Modal>
  );
}
