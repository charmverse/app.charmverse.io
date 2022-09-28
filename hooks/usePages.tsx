import type { Page, Role } from '@prisma/client';
import { PageOperations } from '@prisma/client';
import charmClient from 'charmClient';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import type { Block } from 'lib/focalboard/block';
import type { IPageWithPermissions, PagesMap, PageUpdates } from 'lib/pages';
import type { IPagePermissionFlags, PageOperationType } from 'lib/permissions/pages';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import { permissionTemplates } from 'lib/permissions/pages/page-permission-mapping';
import { useRouter } from 'next/router';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useCallback, createContext, useContext, useMemo, useState } from 'react';
import * as React from 'react';
import { untitledPage } from 'seedData';
import useSWR from 'swr';
import { useCurrentSpace } from './useCurrentSpace';
import useIsAdmin from './useIsAdmin';
import { useUser } from './useUser';

export type LinkedPage = (Page & { children: LinkedPage[], parent: null | LinkedPage });

export type PageUpdater = (updates: PageUpdates, revalidate?: boolean) => Promise<IPageWithPermissions>

export type PagesContext = {
  currentPageId: string;
  pages: PagesMap;
  setPages: Dispatch<SetStateAction<PagesMap>>;
  setCurrentPageId: Dispatch<SetStateAction<string>>;
  refreshPage: (pageId: string) => Promise<IPageWithPermissions>;
  updatePage: PageUpdater;
  mutatePage: (updates: PageUpdates, revalidate?: boolean) => void;
  mutatePagesRemove: (pageIds: string[], revalidate?: boolean) => void;
  deletePage: (data: { pageId: string, board?: Block }) => Promise<void>;
  getPagePermissions: (pageId: string, page?: IPageWithPermissions) => IPagePermissionFlags;
};

const refreshInterval = 1000 * 5 * 60; // 5 minutes

export const PagesContext = createContext<Readonly<PagesContext>>({
  currentPageId: '',
  pages: {},
  setCurrentPageId: () => '',
  setPages: () => undefined,
  getPagePermissions: () => new AllowedPagePermissions(),
  refreshPage: () => Promise.resolve({} as any),
  updatePage: () => Promise.resolve({} as any),
  mutatePage: () => {},
  mutatePagesRemove: () => {},
  deletePage: () => Promise.resolve({} as any)
});

export function PagesProvider ({ children }: { children: ReactNode }) {

  const isAdmin = useIsAdmin();
  const [currentSpace] = useCurrentSpace();
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const router = useRouter();
  const { user } = useUser();

  const { data, mutate } = useSWR(() => currentSpace ? `pages/${currentSpace?.id}` : null, async () => {

    if (!currentSpace) {
      return {};
    }

    const pagesRes = await charmClient.getPages(currentSpace.id);
    const pagesDict: PagesContext['pages'] = {};
    pagesRes?.forEach((page) => {
      pagesDict[page.id] = page;
    }, {});

    return pagesDict;
  }, { refreshInterval });

  const pages = data || {};

  const _setPages: Dispatch<SetStateAction<PagesMap>> = (_pages) => {
    let updatedData: PagesContext['pages'] = {};

    mutate((currentData) => {
      updatedData = _pages instanceof Function ? _pages(currentData || {}) : _pages;
      return updatedData;
    }, {
      revalidate: false
    });

    return updatedData;
  };

  /**
   * Will return permissions for the currently connected user
   * @param pageId
   */
  function getPagePermissions (pageId: string, page?: IPageWithPermissions): IPagePermissionFlags {
    const computedPermissions = new AllowedPagePermissions();

    const targetPage = (pages[pageId] as IPageWithPermissions) ?? page;

    // Return empty permission set so this silently fails
    if (!targetPage) {
      return computedPermissions;
    }
    const userSpaceRole = user?.spaceRoles.find(spaceRole => spaceRole.spaceId === targetPage.spaceId);

    // For now, we allow admin users to override explicitly assigned permissions
    if (isAdmin) {
      computedPermissions.addPermissions(Object.keys(PageOperations) as PageOperationType []);
      return computedPermissions;
    }

    const applicableRoles: Role [] = userSpaceRole?.spaceRoleToRole?.map(spaceRoleToRole => spaceRoleToRole.role) ?? [];

    targetPage.permissions?.forEach(permission => {

      // User gets permission via role or as an individual
      const shouldApplyPermission = (permission.userId && permission.userId === user?.id)
        || (permission.roleId && applicableRoles.some(role => role.id === permission.roleId))
        || (userSpaceRole && permission.spaceId === userSpaceRole.spaceId) || permission.public === true;

      if (shouldApplyPermission) {

        const permissionsToEnable = permission.permissionLevel === 'custom' ? permission.permissions : permissionTemplates[permission.permissionLevel];

        computedPermissions.addPermissions(permissionsToEnable);
      }
    });

    return computedPermissions;
  }

  async function deletePage ({ pageId, board }: { pageId: string, board?: Block }) {
    const page = pages[pageId];
    const totalNonArchivedPages = Object.values(pages).filter((p => p?.deletedAt === null && (p?.type === 'page' || p?.type === 'board'))).length;

    if (page && user && currentSpace) {
      const { pageIds } = await charmClient.archivePage(page.id);
      let newPage: null | IPageWithPermissions = null;
      if (totalNonArchivedPages - pageIds.length === 0 && pageIds.length !== 0) {
        newPage = await charmClient.createPage(untitledPage({
          userId: user.id,
          spaceId: currentSpace.id
        }));
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
        pageIds.forEach(_pageId => {
          _pages[_pageId] = {
            ..._pages[_pageId],
            deletedAt: new Date()
          } as IPageWithPermissions;
        });
        // If a new page was created add that to state
        if (newPage) {
          _pages[newPage.id] = newPage;
        }
        return { ..._pages };
      });
    }
  }

  const mutatePage = useCallback((page: PageUpdates, revalidate = false) => {
    mutate(pagesData => {
      const currentPageData = pagesData?.[page.id];
      if (pagesData) {
        const updatedData: IPageWithPermissions = currentPageData ? { ...currentPageData, ...page } : page as IPageWithPermissions;
        return { ...pagesData, [page.id]: updatedData };
      }
    }, { revalidate });
  }, [mutate]);

  const mutatePagesRemove = useCallback((pageIds: string[], revalidate = false) => {
    mutate(pagesData => {
      if (pagesData) {
        const udpatedData = { ...pagesData };
        pageIds.forEach(id => delete udpatedData[id]);
        return udpatedData;
      }
    }, { revalidate });
  }, [mutate]);

  const updatePage = useCallback(async (updates: PageUpdates, revalidateCache = false) => {
    const updatedPage = await charmClient.pages.updatePage(updates);
    mutatePage(updatedPage, revalidateCache);

    return updatedPage;
  }, [mutatePage]);

  async function refreshPage (pageId: string): Promise<IPageWithPermissions> {
    const freshPageVersion = await charmClient.pages.getPage(pageId);
    mutatePage(freshPageVersion);

    return freshPageVersion;
  }

  const value: PagesContext = useMemo(() => ({
    currentPageId,
    deletePage,
    pages,
    setCurrentPageId,
    setPages: _setPages,
    getPagePermissions,
    refreshPage,
    updatePage,
    mutatePage,
    mutatePagesRemove
  }), [currentPageId, router, pages, user]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export const usePages = () => useContext(PagesContext);
