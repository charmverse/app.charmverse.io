import Stack from '@mui/material/Stack';
import { usePopupState } from 'material-ui-popup-state/hooks';

import Button from 'components/common/Button';
import { isProdEnv } from 'config/constants';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { SpaceSubscriptionWithStripeData } from 'lib/subscription/getActiveSpaceSubscription';

import { ConfirmFreeDowngradeModal } from './ConfirmFreeDowngradeModal';

export function SubscriptionActions({
  spaceSubscription,
  loading,
  paidTier,
  onDelete,
  onCancelAtEnd,
  onReactivation,
  confirmFreeTierDowngrade
}: {
  spaceSubscription: SpaceSubscriptionWithStripeData | null | undefined;
  loading: boolean;
  paidTier: string;
  onDelete: () => void;
  onCancelAtEnd: () => void;
  onReactivation: () => void;
  confirmFreeTierDowngrade: () => void;
}) {
  const isAdmin = useIsAdmin();

  const {
    isOpen: isConfirmDowngradeDialogOpen,
    close: closeConfirmFreeTierDowngradeDialog,
    open: openConfirmFreeTierDowngradeDialog
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
      {(spaceSubscription?.status === 'active' ||
        spaceSubscription?.status === 'cancelled' ||
        spaceSubscription?.status === 'free_trial') && (
        <>
          <Button disabled={loading} onClick={() => {}}>
            Update Plan
          </Button>
          <Button disabled={loading} onClick={onCancelAtEnd} variant='text'>
            Cancel Plan
          </Button>
          {!isProdEnv && (
            <Button disabled={loading} onClick={onDelete} color='error' variant='outlined'>
              Delete Plan
            </Button>
          )}
        </>
      )}
      {(paidTier === 'cancelled' || spaceSubscription?.status === 'cancel_at_end') && (
        <>
          <Button disabled={!isAdmin} onClick={openConfirmFreeTierDowngradeDialog} variant='outlined'>
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
