import charmClient from 'charmClient';
import useSWR from 'swr';
import { useCurrentSpace } from './useCurrentSpace';

export function useCurrentSpacePermissions () {

  const [space] = useCurrentSpace();

  const { data } = useSWR(() => space ? `permissions-${space.id}` : null, () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return charmClient.computeUserSpacePermissions({ spaceId: space!.id });
  }, { revalidateOnFocus: true, focusThrottleInterval: 0 });

  return [data] as const;
}
