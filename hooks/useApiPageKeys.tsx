import useSWR from 'swr';

import charmClient from 'charmClient';

export function useApiPageKeys(pageId: string | undefined) {
  const { data, isLoading } = useSWR(pageId ? `/api/api-page-key?pageId=${pageId}` : null, () =>
    charmClient.getApiPageKeys({ pageId: pageId! })
  );

  return { keys: data, isLoadingKeys: isLoading };
}
