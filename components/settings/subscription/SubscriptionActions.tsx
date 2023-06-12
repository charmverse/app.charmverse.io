import Stack from '@mui/material/Stack';

import Button from 'components/common/Button';
import { isProdEnv } from 'config/constants';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';

export function SubscriptionActions({
  spaceSubscription,
  onCreate,
  onDelete
}: {
  spaceSubscription: SpaceSubscription | null | undefined;
  onCreate: () => void;
  onDelete: () => void;
}) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return null;
  }

  return (
    <Stack flexDirection='row' gap={1} mb={1}>
      {spaceSubscription === null && (
        <Button sx={{ width: 'fit-content' }} onClick={onCreate}>
          Create a Plan
        </Button>
      )}
      {spaceSubscription && (
        <>
          <Button onClick={() => {}} variant='outlined'>
            Upgrade/Downgrade Plan
          </Button>
          <Button onClick={() => {}} color='error' variant='outlined'>
            Cancel Plan
          </Button>
          {!isProdEnv && (
            <Button onClick={onDelete} variant='outlined'>
              Delete Plan
            </Button>
          )}
        </>
      )}
    </Stack>
  );
}
