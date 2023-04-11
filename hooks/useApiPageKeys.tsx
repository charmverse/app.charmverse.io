import useSWR from 'swr';

import charmClient from 'charmClient';

import { useCurrentPage } from './useCurrentPage';

export function useApiPageKeys() {
  const { currentPageId } = useCurrentPage();
  const { data, isLoading } = useSWR(currentPageId ? `/api/api-page-key?pageId=${currentPageId}` : null, () =>
    charmClient.getApiPageKeys({ pageId: currentPageId })
  );

  return { keys: data, isLoadingKeys: isLoading };
}
