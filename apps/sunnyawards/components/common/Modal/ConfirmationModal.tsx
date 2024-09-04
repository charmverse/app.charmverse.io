import { TextField, Typography, Box } from '@mui/material';
import { useState } from 'react';

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

  const [textValue, setTextValue] = useState('');

  return (
    <ModalWithButtons
      open={props.isOpen}
      title={props.title}
      loading={props.loading}
      onClose={props.onCancel || (() => {})}
      onConfirm={props.onConfirm || (() => {})}
      buttonText={props.confirmButton || 'Confirm'}
      disabled={!!props.requiredText && textValue !== props.requiredText}
    >
      <Typography>{props.message}</Typography>
      {props.requiredText && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
          <Typography sx={{ mb: 1 }}>Write the following text to confirm:</Typography>
          <Typography fontWeight='bold'>{props.requiredText}</Typography>
          <TextField
            value={textValue}
            onChange={(ev) => setTextValue(ev.target.value)}
            placeholder={props.requiredText}
          />
        </Box>
      )}
    </ModalWithButtons>
  );
}
