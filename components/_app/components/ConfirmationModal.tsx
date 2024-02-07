import { Typography } from '@mui/material';

import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { useConfirmationModal } from 'hooks/useConfirmationModal';

export type ConfirmationModalProps = {
  isOpen: boolean;
  onCancel?: () => void;
  onConfirm?: () => Promise<void>;
  message: string;
  title?: string;
  confirmButton?: string;
};
// Create a component that will be used to display modal with buttons based on the context
export function ConfirmationModal() {
  const { props } = useConfirmationModal();
  return (
    <ModalWithButtons
      open={props.isOpen}
      title={props.title}
      onClose={props.onCancel || (() => {})}
      onConfirm={props.onConfirm || (() => {})}
      buttonText={props.confirmButton || 'Confirm'}
    >
      <Typography>{props.message}</Typography>
    </ModalWithButtons>
  );
}
