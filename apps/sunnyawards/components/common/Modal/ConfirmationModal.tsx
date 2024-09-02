import { TextField, Typography } from '@mui/material';

import { useConfirmationModal } from 'hooks/useConfirmationModal';

import ModalWithButtons from './ModalWithButtons';

/**
 * @requiredText - Text that is required to be typed so a user can confirm the action
 */
export type ConfirmationModalProps = {
  isOpen: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
  message: string;
  loading?: boolean;
  title?: string;
  confirmButton?: string;
  requiredText?: string;
};
// Create a component that will be used to display modal with buttons based on the context
export function ConfirmationModal() {
  const { props } = useConfirmationModal();

  return (
    <ModalWithButtons
      open={props.isOpen}
      title={props.title}
      loading={props.loading}
      onClose={props.onCancel || (() => {})}
      onConfirm={props.onConfirm || (() => {})}
      buttonText={props.confirmButton || 'Confirm'}
    >
      <Typography>{props.message}</Typography>
      {props.requiredText && (
        <>
          <Typography>
            Write the following text to confirm:
            <strong>{props.requiredText}</strong>
          </Typography>
          <TextField>
            <strong>{props.requiredText}</strong>
          </TextField>
        </>
      )}
    </ModalWithButtons>
  );
}
