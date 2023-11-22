import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

export function useAdditionalBlockQuota() {
  const { space: currentSpace } = useCurrentSpace();
  const { user } = useUser(); // a user session is required to get a result

  const {
    data: additionalBlockQuota = 0,
    isLoading,
    mutate: refetchAdditionalBlockCount
  } = useSWR(currentSpace && user ? `/spaces/${currentSpace.id}/additional-block-quota` : null, () =>
    charmClient.spaces.getAdditionalBlockQuota({ spaceId: currentSpace!.id })
  );

  return {
    additionalBlockQuota,
    isLoading,
    refetchAdditionalBlockCount
  };
}
