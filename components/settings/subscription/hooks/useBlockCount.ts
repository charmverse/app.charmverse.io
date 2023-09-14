import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

export function useBlockCount() {
  const { space: currentSpace } = useCurrentSpace();
  const { user } = useUser(); // a user session is required to get a result

  const {
    data: blockCount,
    isLoading,
    mutate: refetchBlockCount
  } = useSWR(currentSpace && user ? `/spaces/${currentSpace.id}/block-count` : null, () =>
    charmClient.spaces.getBlockCount({ spaceId: currentSpace!.id })
  );

  return {
    blockCount,
    isLoading,
    refetchBlockCount
  };
}
