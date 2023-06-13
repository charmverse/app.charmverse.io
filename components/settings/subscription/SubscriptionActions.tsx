import Stack from '@mui/material/Stack';

import Button from 'components/common/Button';
import { isProdEnv } from 'config/constants';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';

export function SubscriptionActions({
  spaceSubscription,
  loading,
  onCreate,
  onDelete,
  onCancelAtEnd
}: {
  spaceSubscription: SpaceSubscription | null | undefined;
  loading: boolean;
  onCreate: () => void;
  onDelete: () => void;
  onCancelAtEnd: () => void;
}) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return null;
  }

  return (
    <Stack flexDirection='row' gap={1} mb={1}>
      {spaceSubscription === null && (
        <Button disabled={loading} sx={{ width: 'fit-content' }} onClick={onCreate}>
          Create a Plan
        </Button>
      )}
      {spaceSubscription && (
        <>
          <Button disabled={loading} onClick={() => {}} variant='outlined'>
            Upgrade/Downgrade Plan
          </Button>
          <Button disabled={loading} onClick={onCancelAtEnd} color='error' variant='outlined'>
            Cancel Plan
          </Button>
          {!isProdEnv && (
            <Button disabled={loading} onClick={onDelete} variant='outlined'>
              Delete Plan
            </Button>
          )}
        </>
      )}
    </Stack>
  );
}
