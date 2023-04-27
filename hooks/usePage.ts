import { useCallback } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { PageUpdates } from 'lib/pages';
import type { PageWithContent } from 'lib/pages/interfaces';

type Props = {
  spaceId?: string;
  pageIdOrPath?: string;
};

type PageResult = {
  page?: PageWithContent;
  refreshPage: () => Promise<PageWithContent | undefined>;
  updatePage: (updates: PageUpdates) => Promise<void>;
  error?: 'access_denied' | 'page_not_found';
  isLoading?: boolean;
};

const noop = () => Promise.resolve(undefined);

export function usePage({ spaceId, pageIdOrPath }: Props): PageResult {
  const {
    data: pageWithContent,
    error: pageWithContentError,
    mutate
  } = useSWR(spaceId && pageIdOrPath && `page-with-content-${pageIdOrPath}-${spaceId}`, () =>
    charmClient.pages.getPage(pageIdOrPath as string, spaceId as string)
  );

  const updatePage = useCallback((updates: PageUpdates) => {
    return charmClient.pages.updatePage(updates);
  }, []);

  if (pageWithContent) {
    return {
      page: pageWithContent,
      refreshPage: mutate,
      updatePage
    };
  }
  if (pageWithContentError) {
    // An error will be thrown if page doesn't exist or if you dont have read permission for the page
    if (pageWithContentError.errorType === 'Access denied') {
      return {
        error: 'access_denied',
        refreshPage: noop,
        updatePage: noop
      };
    } else {
      // If the page doesn't exist an error will be thrown
      return {
        error: 'page_not_found',
        refreshPage: noop,
        updatePage: noop
      };
    }
  }
  return { isLoading: true, refreshPage: noop, updatePage: noop };
}
