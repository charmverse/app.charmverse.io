import Stack from '@mui/material/Stack';

import Button from 'components/common/Button';
import { isProdEnv } from 'config/constants';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { SpaceSubscriptionWithStripeData } from 'lib/subscription/getActiveSpaceSubscription';

export function SubscriptionActions({
  spaceSubscription,
  loading,
  paidTier,
  onDelete,
  onCancelAtEnd,
  onReactivation,
  handleFreeTier
}: {
  spaceSubscription: SpaceSubscriptionWithStripeData | null | undefined;
  loading: boolean;
  paidTier: string;
  onDelete: () => void;
  onCancelAtEnd: () => void;
  onReactivation: () => void;
  handleFreeTier: () => void;
}) {
  const isAdmin = useIsAdmin();

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
        <Button disabled={!isAdmin} onClick={handleFreeTier} variant='outlined'>
          Use free plan
        </Button>
      )}
    </Stack>
  );
}
