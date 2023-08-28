import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

export function useBlockCount() {
  const { space: currentSpace } = useCurrentSpace();

  const {
    data: blockCount,
    isLoading,
    mutate: refetchBlockCount
  } = useSWR(currentSpace ? `/spaces/${currentSpace.id}/block-count` : null, () =>
    charmClient.spaces.getBlockCount({ spaceId: currentSpace!.id })
  );

  return {
    blockCount,
    isLoading,
    refetchBlockCount
  };
}
