import charmClient from 'charmClient';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
}) {
  const { space } = useCurrentSpace();

  const onConfirm = async () => {
    if (!space) {
      return;
    }

    await charmClient.subscription.cancelSubscription(space.id);
    onSuccess();
    onClose();
  };

  return (
    <ConfirmDeleteModal
      open={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      question='Are you sure you want to cancel your subscription?'
      title='Cancel current subscription'
      buttonText='Cancel'
    />
  );
}
