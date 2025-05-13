import { log } from '@charmverse/core/log';
import type { PageMeta } from '@charmverse/core/pages';
import type { WebSocketPayload } from '@packages/websockets/interfaces';
import { useCallback, useEffect } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { PageUpdates } from 'lib/pages';
import type { PageWithContent } from 'lib/pages/interfaces';

import { useWebSocketClient } from './useWebSocketClient';

type Props = {
  spaceId?: string;
  pageIdOrPath?: string | null;
};

type PageResult = {
  page?: PageWithContent;
  refreshPage: () => Promise<PageWithContent | undefined>;
  updatePage: (updates: PageUpdates) => Promise<void>;
  error?: 'access_denied' | 'page_not_found' | 'system_error';
  isLoading?: boolean;
};

const noop = () => Promise.resolve(undefined);

export function usePage({ spaceId, pageIdOrPath }: Props): PageResult {
  const { subscribe } = useWebSocketClient();
  const {
    data: pageWithContent,
    error: pageWithContentError,
    mutate
  } = useSWR(pageIdOrPath && `page-with-content-${pageIdOrPath}-${spaceId}`, () =>
    charmClient.pages.getPage(pageIdOrPath as string, spaceId as string)
  );

  const updatePage = useCallback(async (updates: PageUpdates) => {
    return charmClient.pages.updatePage(updates);
  }, []);

  useEffect(() => {
    function handleUpdateEvent(value: WebSocketPayload<'pages_meta_updated'>) {
      mutate(
        async (_page): Promise<PageWithContent | undefined> => {
          if (_page) {
            for (let i = 0; i < value.length; i++) {
              if (value[i].id === _page.id) {
                if (value[i].isLocked !== undefined && value[i].isLocked !== _page.isLocked) {
                  const refreshedPermissions = await charmClient.permissions.pages.computePagePermissions({
                    pageIdOrPath: _page.id
                  });
                  (value[i] as PageWithContent).permissionFlags = refreshedPermissions;
                }

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
        log.debug('Page deleted or restored, invalidating cache', { pageId: pageWithContent?.id });
        mutate(undefined, {
          rollbackOnError: false
        });
      }
    }
    const unsubscribeFromPageUpdates = subscribe('pages_meta_updated', handleUpdateEvent);
    const unsubscribeFromPageDeletes = subscribe('pages_deleted', handleDeleteEvent);
    const unsubscribeFromPageRestores = subscribe('pages_restored', handleDeleteEvent);

    return () => {
      unsubscribeFromPageUpdates();
      unsubscribeFromPageDeletes();
      unsubscribeFromPageRestores();
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
    } else if (pageWithContentError.errorType === 'Data not found') {
      // If the page doesn't exist an error will be thrown
      return {
        error: 'page_not_found',
        refreshPage: noop,
        updatePage: noop
      };
    } else {
      // If the page doesn't exist an error will be thrown
      return {
        error: 'system_error',
        refreshPage: noop,
        updatePage: noop
      };
    }
  }
  return { isLoading: true, refreshPage: noop, updatePage: noop };
}
