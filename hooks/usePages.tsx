import { Page, PageOperations, Role, Space } from '@prisma/client';
import charmClient from 'charmClient';
import { IPageWithPermissions } from 'lib/pages';
import { IPagePermissionFlags, PageOperationType } from 'lib/permissions/pages';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import { permissionTemplates } from 'lib/permissions/pages/page-permission-mapping';
import { useRouter } from 'next/router';
import * as React from 'react';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import { isTruthy } from 'lib/utilities/types';
import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';
import useIsAdmin from './useIsAdmin';

export type LinkedPage = (Page & {children: LinkedPage[], parent: null | LinkedPage});

type PagesMap = Record<string, Page | undefined>;

type IContext = {
  currentPageId: string,
  pages: PagesMap,
  setPages: Dispatch<SetStateAction<PagesMap>>,
  setCurrentPageId: Dispatch<SetStateAction<string>>,
  isEditing: boolean
  refreshPage: (pageId: string) => Promise<IPageWithPermissions>
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
  getPagePermissions: (pageId: string) => IPagePermissionFlags,
  deletePage: (pageId: string) => Promise<void>,
  restorePage: (pageId: string, route?: boolean) => Promise<void>,
};

const refreshInterval = 1000 * 5 * 60; // 5 minutes

export const PagesContext = createContext<Readonly<IContext>>({
  currentPageId: '',
  pages: {},
  setCurrentPageId: () => '',
  setPages: () => undefined,
  isEditing: true,
  setIsEditing: () => { },
  getPagePermissions: () => new AllowedPagePermissions(),
  refreshPage: () => Promise.resolve({} as any),
  deletePage: () => undefined as any,
  restorePage: () => undefined as any
});

export function PagesProvider ({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [space] = useCurrentSpace();
  const [pages, setPages] = useState<IContext['pages']>({});
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const router = useRouter();
  const [user] = useUser();
  const { data, mutate } = useSWR(() => space ? `pages/${space?.id}` : null, () => {
    return charmClient.getPages((space as Space).id);
  }, { refreshInterval });
  const dispatch = useAppDispatch();

  const isAdmin = useIsAdmin();

  const _setPages: Dispatch<SetStateAction<PagesMap>> = React.useCallback((_pages) => {
    const res = _pages instanceof Function ? _pages(pages) : _pages;
    mutate(() => Object.values(res).filter(isTruthy), {
      revalidate: false
    });
    return res;
  }, [mutate, pages]);

  async function deletePage (pageId: string) {
    const { pageIds } = await charmClient.deletePage(pageId);
    _setPages((_pages) => {
      pageIds.forEach(_pageId => {
        delete _pages[_pageId];
      });
      return { ..._pages };
    });
    // If the current page has been deleted permanently route to the first alive page
    if (pageIds.includes(currentPageId)) {
      router.push(`/${router.query.domain}/${Object.values(pages).find(page => page?.type !== 'card' && page?.deletedAt === null)?.path}`);
    }
  }

  async function restorePage (pageId: string) {
    const { pageIds } = await charmClient.restorePage(pageId);
    _setPages((_pages) => {
      pageIds.forEach(_pageId => {
        if (_pages[_pageId]) {
          _pages[_pageId] = {
            ..._pages[_pageId],
            deletedAt: null
          } as Page;
        }
      });
      // Severe the link with parent if its not of type card
      if (_pages[pageId] && _pages[pageId]?.type !== 'card') {
        (_pages[pageId] as Page).parentId = null;
      }
      return { ..._pages };
    });

    // TODO: Better focalboard blocks api to only fetch blocks by id
    dispatch(initialLoad());
  }

  /**
   * Will return permissions for the currently connected user
   * @param pageId
   */
  function getPagePermissions (pageId: string): IPagePermissionFlags {
    const computedPermissions = new AllowedPagePermissions();

    const targetPage = pages[pageId] as IPageWithPermissions;

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

  async function refreshPage (pageId: string): Promise<IPageWithPermissions> {
    const freshPageVersion = await charmClient.getPage(pageId);
    _setPages({
      ...pages,
      [freshPageVersion.id]: freshPageVersion
    });

    return freshPageVersion;
  }

  const value: IContext = useMemo(() => ({
    currentPageId,
    isEditing,
    setIsEditing,
    pages,
    setCurrentPageId,
    setPages: _setPages,
    getPagePermissions,
    refreshPage,
    deletePage,
    restorePage
  }), [currentPageId, isEditing, router, pages, user]);

  useEffect(() => {
    if (data) {
      setPages(data.reduce((acc, page) => ({ ...acc, [page.id]: page }), {}) || {});
    }
  }, [data]);

  useEffect(() => {
    if (currentPageId) {
      refreshPage(currentPageId);
    }

  }, [currentPageId]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export const usePages = () => useContext(PagesContext);
