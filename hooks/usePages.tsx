import type { Page, Role } from '@prisma/client';
import { PageOperations } from '@prisma/client';
import { useRouter } from 'next/router';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { KeyedMutator } from 'swr';
import useSWR, { mutate } from 'swr';

import charmClient from 'charmClient';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import type { Block } from 'lib/focalboard/block';
import type { PageMeta, PagesMap, PageUpdates } from 'lib/pages';
import { untitledPage } from 'lib/pages/untitledPage';
import type { IPagePermissionFlags, PageOperationType } from 'lib/permissions/pages';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import { permissionTemplates } from 'lib/permissions/pages/page-permission-mapping';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { useCurrentSpace } from './useCurrentSpace';
import { useIsAdmin } from './useIsAdmin';
import { useUser } from './useUser';
import { useWebSocketClient } from './useWebSocketClient';

export type LinkedPage = Page & { children: LinkedPage[]; parent: null | LinkedPage };

export type PageUpdater = (updates: PageUpdates, revalidate?: boolean) => Promise<PageMeta>;

export type PagesContext = {
  loadingPages: boolean;
  pages: PagesMap;
  setPages: Dispatch<SetStateAction<PagesMap>>;
  refreshPage: (pageId: string) => Promise<PageMeta>;
  updatePage: PageUpdater;
  mutatePage: (updates: PageUpdates, revalidate?: boolean) => void;
  mutatePagesRemove: (pageIds: string[], revalidate?: boolean) => void;
  deletePage: (data: { pageId: string; board?: Block }) => Promise<PageMeta | null | undefined>;
  getPagePermissions: (pageId: string, page?: PageMeta) => IPagePermissionFlags | null;
  mutatePagesList: KeyedMutator<PagesMap<PageMeta>>;
};

const refreshInterval = 1000 * 30 * 60; // 30 minutes - this is just a fallback in case the websocket fails

export const PagesContext = createContext<Readonly<PagesContext>>({
  loadingPages: true,
  pages: {},
  setPages: () => undefined,
  getPagePermissions: () => new AllowedPagePermissions(),
  refreshPage: () => Promise.resolve({} as any),
  updatePage: () => Promise.resolve({} as any),
  mutatePage: () => {},
  mutatePagesRemove: () => {},
  deletePage: () => Promise.resolve({} as any),
  mutatePagesList: () => Promise.resolve({} as any)
});

export function PagesProvider({ children }: { children: ReactNode }) {
  const isAdmin = useIsAdmin();
  const currentSpace = useCurrentSpace();
  const currentSpaceId = useRef<undefined | string>();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { subscribe } = useWebSocketClient();

  const { data, mutate: mutatePagesList } = useSWR(
    () => getPagesListCacheKey(currentSpace?.id),
    async () => {
      if (!currentSpace) {
        return {};
      }

      const pagesRes = await charmClient.pages.getPages(currentSpace.id);
      const pagesDict: PagesContext['pages'] = {};
      pagesRes?.forEach((page) => {
        pagesDict[page.id] = page;
      }, {});

      return pagesDict;
    },
    { refreshInterval, revalidateOnFocus: false }
  );

  const pages = data || {};

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
  /**
   * Will return permissions for the currently connected user
   * @param pageId
   */
  function getPagePermissions(pageId: string, deletedPage?: PageMeta): IPagePermissionFlags | null {
    const computedPermissions = new AllowedPagePermissions();

    const targetPage = pages[pageId] ?? deletedPage;

    // Return empty permission set so this silently fails
    if (!targetPage || !isUserLoaded) {
      return computedPermissions;
    }
    if (!isUserLoaded) {
      return null;
    }
    const userSpaceRole = user?.spaceRoles.find((spaceRole) => spaceRole.spaceId === targetPage.spaceId);

    if (targetPage.type === 'card_synced') {
      computedPermissions.addPermissions(permissionTemplates.view);
    } else {
      // For now, we allow admin users to override explicitly assigned permissions
      if (isAdmin) {
        computedPermissions.addPermissions(Object.keys(PageOperations) as PageOperationType[]);
        return computedPermissions;
      }

      const applicableRoles: Role[] =
        userSpaceRole?.spaceRoleToRole?.map((spaceRoleToRole) => spaceRoleToRole.role) ?? [];

      targetPage.permissions?.forEach((permission) => {
        // User gets permission via role or as an individual
        const shouldApplyPermission =
          (permission.userId && permission.userId === user?.id) ||
          (permission.roleId && applicableRoles.some((role) => role.id === permission.roleId)) ||
          (userSpaceRole && permission.spaceId === userSpaceRole.spaceId) ||
          permission.public === true;
        if (shouldApplyPermission) {
          const permissionsToEnable =
            permission.permissionLevel === 'custom'
              ? permission.permissions
              : permissionTemplates[permission.permissionLevel];

          computedPermissions.addPermissions(permissionsToEnable);
        }
      });
    }

    return computedPermissions;
  }

  async function deletePage({ pageId, board }: { pageId: string; board?: Block }) {
    const page = pages[pageId];
    const totalNonArchivedPages = Object.values(pages).filter(
      (p) => p?.deletedAt === null && (p?.type === 'page' || p?.type === 'board')
    ).length;

    if (page && user && currentSpace) {
      const { pageIds } = await charmClient.archivePage(page.id);
      let newPage: null | PageMeta = null;
      if (totalNonArchivedPages - pageIds.length === 0 && pageIds.length !== 0) {
        newPage = await charmClient.createPage(
          untitledPage({
            userId: user.id,
            spaceId: currentSpace.id
          })
        );
      }

      // Delete the page associated with the card
      if (board) {
        mutator.deleteBlock(
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

      _setPages((_pages) => {
        pageIds.forEach((_pageId) => {
          _pages[_pageId] = {
            ..._pages[_pageId],
            deletedBy: user.id,
            deletedAt: new Date()
          } as PageMeta;
        });
        // If a new page was created add that to state
        if (newPage) {
          _pages[newPage.id] = newPage;
        }
        return { ..._pages };
      });

      return newPage;
    }
  }

  const mutatePage = useCallback(
    (page: PageUpdates, revalidate = false) => {
      mutatePagesList(
        (pagesData) => {
          const currentPageData = pagesData?.[page.id];
          if (pagesData) {
            const updatedData: PageMeta = currentPageData ? { ...currentPageData, ...page } : (page as PageMeta);
            return { ...pagesData, [page.id]: updatedData };
          }
        },
        { revalidate }
      );
    },
    [mutate]
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
    [mutate]
  );

  const updatePage = useCallback((updates: PageUpdates) => {
    return charmClient.pages.updatePage(updates);
  }, []);

  async function refreshPage(pageId: string): Promise<PageMeta> {
    const freshPageVersion = await charmClient.pages.getPage(pageId);
    mutatePage(freshPageVersion);

    return freshPageVersion;
  }

  const handleUpdateEvent = useCallback((value: WebSocketPayload<'pages_meta_updated'>) => {
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

        return {
          ..._existingPages,
          ...pagesToUpdate
        };
      },
      {
        revalidate: false
      }
    );
  }, []);

  const handleNewPageEvent = useCallback((value: WebSocketPayload<'pages_created'>) => {
    const newPages = value.reduce<PagesMap>((pageMap, page) => {
      if (page.spaceId === currentSpaceId.current) {
        pageMap[page.id] = page;
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
  }, []);

  const handleDeleteEvent = useCallback((value: WebSocketPayload<'pages_deleted'>) => {
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
  }, []);

  useEffect(() => {
    currentSpaceId.current = currentSpace?.id;
  }, [currentSpace]);

  useEffect(() => {
    const unsubscribeFromPageUpdates = subscribe('pages_meta_updated', handleUpdateEvent);
    const unsubscribeFromNewPages = subscribe('pages_created', handleNewPageEvent);
    const unsubscribeFromPageDeletes = subscribe('pages_deleted', handleDeleteEvent);

    return () => {
      unsubscribeFromPageUpdates();
      unsubscribeFromNewPages();
      unsubscribeFromPageDeletes();
    };
  }, []);

  const value: PagesContext = useMemo(
    () => ({
      deletePage,
      loadingPages: !data,
      pages,
      setPages: _setPages,
      getPagePermissions,
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
