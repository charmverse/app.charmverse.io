import useSWR from 'swr';

import charmClient from 'charmClient';

import { useCurrentPage } from './useCurrentPage';

export function useApiPageKeys(boardId?: string) {
  const { currentPageId } = useCurrentPage();
  const pageId = boardId || currentPageId;
  const { data, isLoading } = useSWR(pageId ? `/api/api-page-key?pageId=${pageId}` : null, () =>
    charmClient.getApiPageKeys({ pageId })
  );

  return { keys: data, isLoadingKeys: isLoading };
}
