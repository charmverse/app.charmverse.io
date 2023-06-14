import useSWR from 'swr';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

export function useCurrentSpacePermissions() {
  const { space } = useCurrentSpace();
  // We want dependency on user so we refetch permissions on space or user change
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useUser();

  const { data } = useSWR(
    () => (space ? `permissions-${space.id}` : null),
    () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return charmClient.permissions.spaces.computeUserSpacePermissions({ spaceId: space!.id });
    },
    { revalidateOnFocus: true, focusThrottleInterval: 0 }
  );

  return [data] as const;
}
