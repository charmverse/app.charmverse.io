import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

export function useBlockCount() {
  const { space: currentSpace } = useCurrentSpace();
  const { user } = useUser(); // a user session is required to get a result

  const { data } = useSWR(currentSpace && user ? `/spaces/${currentSpace.id}/block-count` : null, () =>
    charmClient.spaces.getBlockCount({ spaceId: currentSpace!.id })
  );

  return {
    data,
    count: data?.count ?? 0,
    additionalQuota: data?.additionalQuota ?? 0
  };
}
