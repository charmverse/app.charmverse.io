import type { SubscriptionTier } from '@charmverse/core/prisma';
import Stack from '@mui/material/Stack';
import { usePopupState } from 'material-ui-popup-state/hooks';

import { Button } from 'components/common/Button';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { SpaceSubscriptionWithStripeData } from '@packages/lib/subscription/getActiveSpaceSubscription';

import { ConfirmFreeDowngradeModal } from './ConfirmFreeDowngradeModal';
import { ConfirmPlanCancellationModal } from './ConfirmPlanCancellation';

export function SubscriptionActions({
  spaceSubscription,
  loading,
  paidTier,
  onCancelAtEnd,
  onReactivation,
  onUpgrade,
  confirmFreeTierDowngrade
}: {
  spaceSubscription: SpaceSubscriptionWithStripeData | null | undefined;
  loading: boolean;
  paidTier: SubscriptionTier;
  onCancelAtEnd: () => void;
  onReactivation: () => void;
  onUpgrade: () => void;
  confirmFreeTierDowngrade: () => void;
}) {
  const isAdmin = useIsAdmin();

  const {
    isOpen: isConfirmDowngradeDialogOpen,
    close: closeConfirmFreeTierDowngradeDialog,
    open: openConfirmFreeTierDowngradeDialog
  } = usePopupState({ variant: 'popover', popupId: 'susbcription-actions' });

  const {
    isOpen: isConfirmCancelPlanDialogOpen,
    close: closeConfirmCancelPlanDialog,
    open: openConfirmCancelPlanDialog
  } = usePopupState({ variant: 'popover', popupId: 'susbcription-actions' });

  if (!isAdmin) {
    return null;
  }

  return (
    <Stack flexDirection='column' gap={1} mb={1}>
      {spaceSubscription?.status === 'cancel_at_end' && (
        <Button disabled={loading} onClick={onReactivation}>
          Reactivate Plan
        </Button>
      )}
      {spaceSubscription?.status === 'active' && (
        <>
          <Button disabled={loading} onClick={onUpgrade}>
            Update Plan
          </Button>
          <Button disabled={loading} onClick={openConfirmCancelPlanDialog} variant='text'>
            Cancel Plan
          </Button>
          <ConfirmPlanCancellationModal
            disabled={!isAdmin}
            onConfirmCancellation={onCancelAtEnd}
            onClose={closeConfirmCancelPlanDialog}
            isOpen={isConfirmCancelPlanDialogOpen}
          />
        </>
      )}
      {(paidTier === 'cancelled' ||
        spaceSubscription?.status === 'cancel_at_end' ||
        spaceSubscription?.status === 'past_due' ||
        spaceSubscription?.status === 'unpaid') && (
        <>
          <Button disabled={loading} onClick={openConfirmFreeTierDowngradeDialog} variant='outlined'>
            Use free plan
          </Button>
          <ConfirmFreeDowngradeModal
            isOpen={isConfirmDowngradeDialogOpen}
            onClose={closeConfirmFreeTierDowngradeDialog}
            disabled={loading}
            onConfirmDowngrade={confirmFreeTierDowngrade}
          />
        </>
      )}
    </Stack>
  );
}
