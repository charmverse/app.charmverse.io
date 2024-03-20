import type { PageMeta } from '@charmverse/core/pages';
import type { Page } from '@charmverse/core/prisma';
import { useRouter } from 'next/router';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useTrashPages, useInitialPagesForSpace } from 'charmClient/hooks/pages';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { updateCards } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import type { Block } from 'lib/databases/block';
import type { PagesMap, PageUpdates } from 'lib/pages/interfaces';
import { untitledPage } from 'lib/pages/untitledPage';
import { isTruthy } from 'lib/utils/types';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';
import { useWebSocketClient } from './useWebSocketClient';

export type LinkedPage = Page & { children: LinkedPage[]; parent: null | LinkedPage };

export type PagesContext = {
  loadingPages: boolean;
  pages: PagesMap;
  setPages: Dispatch<SetStateAction<PagesMap>>;
  refreshPage: (pageId: string) => Promise<PageMeta>;
  getPageByPath: (pageId: string) => PageMeta | undefined;
  updatePage: (updates: PageUpdates, revalidate?: boolean) => Promise<void>;
  mutatePage: (updates: PageUpdates, revalidate?: boolean) => Promise<any>;
  mutatePagesRemove: (pageIds: string[], revalidate?: boolean) => void;
  deletePage: (data: { pageId: string; board?: Block }) => Promise<PageMeta | null | undefined>;
  mutatePagesList: (data: PagesMap<PageMeta>) => Promise<any>;
};

const refreshInterval = 1000 * 30 * 60; // 30 minutes - this is just a fallback in case the websocket fails

export const PagesContext = createContext<Readonly<PagesContext>>({
  loadingPages: true,
  pages: {},
  setPages: () => undefined,
  getPageByPath: () => undefined,
  refreshPage: () => Promise.resolve({} as any),
  updatePage: () => Promise.resolve(),
  mutatePage: () => Promise.resolve(),
  mutatePagesRemove: () => null,
  deletePage: () => Promise.resolve(undefined),
  mutatePagesList: () => Promise.resolve()
});

export function PagesProvider({ children }: { children: ReactNode }) {
  const { space: currentSpace, spaceRole } = useCurrentSpace();
  const currentSpaceId = useRef<undefined | string>();
  const router = useRouter();
  const { user } = useUser();
  const dispatch = useAppDispatch();
  const { sendMessage, subscribe } = useWebSocketClient();
  const { trigger: trashPages } = useTrashPages();
  const pagesDispatched = useRef(false);
  // temporary optimization: load non-card pages first
  const { data: initialPages } = useInitialPagesForSpace(currentSpace?.id);
  const {
    data,
    mutate: mutatePagesList,
    isLoading
  } = useSWR(
    () => getPagesListCacheKey(currentSpace?.id),
    async () => {
      if (!currentSpace) {
        return {};
      }

      const pagesRes = await charmClient.pages.getPages({ spaceId: currentSpace.id });
      const pagesDict: PagesContext['pages'] = {};
      pagesRes?.forEach((page) => {
        pagesDict[page.id] = page;
      }, {});

      return pagesDict;
    },
    { refreshInterval, revalidateOnFocus: false }
  );

  const pages = useMemo<PagesMap>(() => {
    if (data) {
      return data;
    }
    if (initialPages) {
      return initialPages.reduce<PagesMap>((acc, page) => {
        acc[page.id] = page;
        return acc;
      }, {});
    }
    return {};
  }, [data, initialPages]);

  const _setPages: Dispatch<SetStateAction<PagesMap>> = (_pages) => {
    let updatedData: PagesContext['pages'] = {};

    mutatePagesList(
      (currentData) => {
        updatedData = _pages instanceof Function ? _pages(currentData || {}) : _pages;
        return updatedData;
      },
      {
        revalidate: false
      }
    );

    return updatedData;
  };

  useEffect(() => {
    if (data && !isLoading && !pagesDispatched.current) {
      const cardPages = Object.values(data)
        .filter(isTruthy)
        .filter((page) => page.type === 'card');

      if (cardPages.length) {
        dispatch(updateCards(cardPages.map((page) => ({ id: page.id, title: page.title }))));
      }
      pagesDispatched.current = true;
    }
  }, [data, isLoading]);

  async function deletePage({ pageId, board }: { pageId: string; board?: Block }) {
    const page = pages[pageId];
    const totalNonArchivedPages = Object.values(pages).filter(
      (p) => !p?.deletedAt && (p?.type === 'page' || p?.type === 'board' || p?.type === 'card')
    ).length;

    const pageType = page?.type;

    if (user && currentSpace) {
      if (pageType === 'page' || pageType === 'board') {
        sendMessage({
          payload: {
            id: pageId
          },
          type: 'page_deleted'
        });

        if (board) {
          await mutator.deleteBlock(
            board,
            'Delete board',
            async () => {
              // success
            },
            async () => {
              // error
            }
          );
        }
      } else {
        const result = await trashPages({ pageIds: [pageId], trash: true });
        if (!result) {
          return;
        }
        const pageIds = result.pageIds;
        let newPage: null | PageMeta = null;
        if (totalNonArchivedPages - pageIds.length === 0 && pageIds.length !== 0) {
          newPage = await charmClient.createPage(
            untitledPage({
              userId: user.id,
              spaceId: currentSpace.id
            })
          );
        }

        return newPage;
      }
    }
  }

  const mutatePage = useCallback(
    (page: PageUpdates, revalidate = false) => {
      return mutatePagesList(
        (pagesData) => {
          if (pagesData) {
            const currentPageData = pagesData[page.id];
            const updatedData: PageMeta = currentPageData ? { ...currentPageData, ...page } : (page as PageMeta);
            return { ...pagesData, [page.id]: updatedData };
          }
          return { [page.id]: page as PageMeta };
        },
        { revalidate }
      );
    },
    [mutatePagesList]
  );

  const mutatePagesRemove = useCallback(
    (pageIds: string[], revalidate = false) => {
      mutatePagesList(
        (pagesData) => {
          if (pagesData) {
            const udpatedData = { ...pagesData };
            pageIds.forEach((id) => delete udpatedData[id]);
            return udpatedData;
          }
        },
        { revalidate }
      );
    },
    [mutatePagesList]
  );

  const updatePage = useCallback((updates: PageUpdates) => {
    return charmClient.pages.updatePage(updates);
  }, []);

  const getPageByPath = useCallback(
    (pagePath: string) => {
      return Object.values(pages).find((p) => p?.path === pagePath);
    },
    [pages]
  );

  async function refreshPage(pageId: string): Promise<PageMeta> {
    const freshPageVersion = await charmClient.pages.getPage(pageId);
    mutatePage(freshPageVersion);

    return freshPageVersion;
  }

  const handleUpdateEvent = useCallback(
    (value: WebSocketPayload<'pages_meta_updated'>) => {
      mutatePagesList(
        (existingPages) => {
          const _existingPages = existingPages || {};
          const pagesToUpdate = value.reduce<PagesMap>((pageMap, updatedPageMeta) => {
            const existingPage = _existingPages[updatedPageMeta.id];

            if (existingPage && updatedPageMeta.spaceId === currentSpaceId.current) {
              pageMap[updatedPageMeta.id] = {
                ...existingPage,
                ...updatedPageMeta
              };
            }

            return pageMap;
          }, {});

          const cardPages = Object.values(pagesToUpdate)
            .filter(isTruthy)
            .filter((page) => page.type === 'card');

          if (cardPages.length) {
            dispatch(updateCards(cardPages.map((page) => ({ id: page.id, title: page.title }))));
          }

          return {
            ..._existingPages,
            ...pagesToUpdate
          };
        },
        {
          revalidate: false
        }
      );
    },
    [mutatePagesList]
  );

  const handleNewPageEvent = useCallback(
    (value: WebSocketPayload<'pages_created'>) => {
      const newPages = value.reduce<PagesMap>((pageMap, page) => {
        if (page.spaceId === currentSpaceId.current) {
          pageMap[page.id] = page;
          if (page.type === 'card') {
            dispatch(
              updateCards([
                {
                  id: page.id,
                  title: page.title
                }
              ])
            );
          }
        }
        return pageMap;
      }, {});

      mutatePagesList(
        (existingPages) => {
          return {
            ...(existingPages ?? {}),
            ...newPages
          };
        },
        {
          revalidate: false
        }
      );
    },
    [mutatePagesList]
  );

  const handleDeleteEvent = useCallback(
    (value: WebSocketPayload<'pages_deleted'>) => {
      mutatePagesList(
        (existingPages) => {
          const newValue = { ...existingPages };

          value.forEach((deletedPage) => {
            delete newValue[deletedPage.id];
          });

          return newValue;
        },
        {
          revalidate: false
        }
      );
    },
    [mutatePagesList]
  );

  useEffect(() => {
    currentSpaceId.current = currentSpace?.id;
  }, [currentSpace]);

  useEffect(() => {
    let unsubscribeFromNewPages: (() => void) | undefined;
    if (spaceRole && !spaceRole.isGuest) {
      unsubscribeFromNewPages = subscribe('pages_created', handleNewPageEvent);
    }
    const unsubscribeFromPageUpdates = subscribe('pages_meta_updated', handleUpdateEvent);

    const unsubscribeFromPageDeletes = subscribe('pages_deleted', handleDeleteEvent);

    return () => {
      unsubscribeFromPageUpdates();
      unsubscribeFromNewPages?.();
      unsubscribeFromPageDeletes();
    };
  }, [spaceRole]);

  const value: PagesContext = useMemo(
    () => ({
      deletePage,
      loadingPages: !data,
      pages,
      getPageByPath,
      setPages: _setPages,
      refreshPage,
      updatePage,
      mutatePage,
      mutatePagesRemove,
      mutatePagesList
    }),
    [router, !!data, pages, user]
  );

  return <PagesContext.Provider value={value}>{children}</PagesContext.Provider>;
}

export function getPagesListCacheKey(spaceId?: string) {
  if (!spaceId) return null;

  return `pages/${spaceId}`;
}

export const usePages = () => useContext(PagesContext);
