import { log } from '@charmverse/core/log';
import type { PageMeta } from '@charmverse/core/pages';
import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { PageUpdates } from 'lib/pages';
import type { PageWithContent } from 'lib/pages/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { useCurrentPage } from './useCurrentPage';
import { useCurrentSpace } from './useCurrentSpace';
import { useWebSocketClient } from './useWebSocketClient';

type Props = {
  spaceId?: string;
  pageIdOrPath?: string | null;
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
  const router = useRouter();
  const { subscribe } = useWebSocketClient();
  const {
    data: pageWithContent,
    error: pageWithContentError,
    mutate
  } = useSWR(pageIdOrPath && `page-with-content-${pageIdOrPath}-${spaceId}`, () =>
    charmClient.pages.getPage(pageIdOrPath as string, spaceId as string)
  );

  console.log('Router', router);

  const updatePage = useCallback(async (updates: PageUpdates) => {
    await charmClient.pages.updatePage(updates);

    if (router.query.pageId === pageIdOrPath && updates.title) {
      console.log('UPDATE DETECTED');
    }
    // if (currentPageId && currentPageId === pageWithContent?.id && space) {
    //   setUrlWithoutRerender(`/${space.domain}/${pageWithContent.id}`, {});
    // }
  }, []);

  useEffect(() => {
    function handleUpdateEvent(value: WebSocketPayload<'pages_meta_updated'>) {
      mutate(
        (_page): PageWithContent | undefined => {
          if (_page) {
            for (let i = 0; i < value.length; i++) {
              if (value[i].id === _page.id) {
                return {
                  ..._page,
                  ...(value[i] as PageMeta)
                };
              }
            }
          }
          return _page;
        },
        {
          revalidate: false
        }
      );
    }
    function handleDeleteEvent(value: WebSocketPayload<'pages_deleted'>) {
      if (value.some((page) => page.id === pageWithContent?.id)) {
        log.debug('Page deleted, invalidating cache', { pageId: pageWithContent?.id });
        mutate(undefined, {
          rollbackOnError: false
        });
      }
    }
    const unsubscribeFromPageUpdates = subscribe('pages_meta_updated', handleUpdateEvent);
    const unsubscribeFromPageDeletes = subscribe('pages_deleted', handleDeleteEvent);

    return () => {
      unsubscribeFromPageUpdates();
      unsubscribeFromPageDeletes();
    };
  }, [mutate, pageWithContent?.id]);

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
