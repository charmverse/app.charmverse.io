import charmClient from 'charmClient';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';

export function ReactivateSubscriptionModal({
  spaceId,
  isOpen,
  onClose,
  onSuccess
}: {
  spaceId: string;
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
}) {
  const onConfirm = async () => {
    await charmClient.subscription.reactivateSubscription(spaceId);
    onSuccess();
    onClose();
  };

  return (
    <ConfirmDeleteModal
      open={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      question='Are you sure you want to reactivate your subscription?'
      title='Reactivate subscription'
      buttonText='Reactivate'
      primaryButtonColor='primary'
    />
  );
}
