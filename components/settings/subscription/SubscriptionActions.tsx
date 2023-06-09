import Stack from '@mui/material/Stack';

import Button from 'components/common/Button';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';

export function SubscriptionActions({
  spaceSubscription,
  onCreate
}: {
  spaceSubscription: SpaceSubscription | null | undefined;
  onCreate: () => void;
}) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return null;
  }

  return (
    <Stack flexDirection='row' gap={1}>
      {spaceSubscription === null && (
        <Button sx={{ width: 'fit-content' }} onClick={onCreate}>
          Create a Plan
        </Button>
      )}
      {spaceSubscription && (
        <>
          <Button onClick={() => {}} color='error' variant='outlined'>
            Upgrade/Downgrade Plan
          </Button>
          <Button onClick={() => {}} color='error' variant='outlined'>
            Cancel Plan
          </Button>
        </>
      )}
    </Stack>
  );
}
