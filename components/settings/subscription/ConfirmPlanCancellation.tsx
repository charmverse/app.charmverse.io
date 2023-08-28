import Typography from '@mui/material/Typography';

import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancellation: () => void;
  disabled: boolean;
};
export function ConfirmPlanCancellationModal({ isOpen, onClose, onConfirmCancellation, disabled }: Props) {
  return (
    <ConfirmDeleteModal
      title='Confirm plan cancellation'
      size='large'
      open={isOpen}
      buttonText='Cancel plan'
      secondaryButtonText='Keep current plan'
      question={
        <Typography>
          Your space will continue with the current plan until the end of the current billing period.
        </Typography>
      }
      onConfirm={onConfirmCancellation}
      onClose={onClose}
      disabled={disabled}
    />
  );
}
