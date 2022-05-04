
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Modal, ModalProps } from 'components/common/Modal';
import Button from 'components/common/Button';

type Props = Pick<ModalProps, 'onClose' | 'open'> & {
  question: string,
  buttonText?: string;
  title?: string;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal ({
  onClose,
  open,
  question,
  buttonText = 'Delete',
  title,
  onConfirm
}: Props) {

  function _onConfirm () {
    onConfirm();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
    >
      <Typography>
        {question}
      </Typography>

      <Box sx={{ columnSpacing: 2, mt: 3 }}>
        <Button
          color='error'
          elevation={0}
          sx={{ mr: 2, fontWeight: 'bold' }}
          onClick={_onConfirm}
        >
          {buttonText}
        </Button>

        <Button
          color='secondary'
          elevation={0}
          onClick={onClose}
        >
          Cancel
        </Button>
      </Box>
    </Modal>
  );
}
