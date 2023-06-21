import Stack from '@mui/material/Stack';

import Button from 'components/common/Button';
import { isProdEnv } from 'config/constants';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';

export function SubscriptionActions({
  spaceSubscription,
  loading,
  onDelete,
  onCancelAtEnd,
  onReactivation
}: {
  spaceSubscription: SpaceSubscription | null | undefined;
  loading: boolean;
  onDelete: () => void;
  onCancelAtEnd: () => void;
  onReactivation: () => void;
}) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return null;
  }

  return (
    <Stack flexDirection='row' gap={1} mb={1}>
      {spaceSubscription?.status === 'cancelAtEnd' && (
        <Button disabled={loading} onClick={onReactivation} variant='outlined'>
          Reactivate Plan
        </Button>
      )}
      {spaceSubscription?.status === 'active' && (
        <>
          <Button disabled={loading} onClick={() => {}} variant='outlined'>
            Upgrade/Downgrade Plan
          </Button>
          <Button disabled={loading} onClick={onCancelAtEnd} color='error' variant='outlined'>
            Cancel Plan
          </Button>
          {!isProdEnv && (
            <Button disabled={loading} onClick={onDelete} color='error' variant='outlined'>
              Delete Plan
            </Button>
          )}
        </>
      )}
    </Stack>
  );
}
