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
import { isTruthy } from 'lib/utilities/types';
import useRefState from 'hooks/useRefState';
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
  getPagePermissions: (pageId: string, page?: IPageWithPermissions) => IPagePermissionFlags,
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
  refreshPage: () => Promise.resolve({} as any)
});

export function PagesProvider ({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [space] = useCurrentSpace();
  const [pages, pagesRef, setPages] = useRefState<IContext['pages']>({});
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const router = useRouter();
  const [user] = useUser();
  const { data, mutate } = useSWR(() => space ? `pages/${space?.id}` : 'publicPage', () => {
    return space ? charmClient.getPages((space as Space).id) : [];
  }, { refreshInterval });

  const isAdmin = useIsAdmin();

  const _setPages: Dispatch<SetStateAction<PagesMap>> = (_pages) => {
    const res = _pages instanceof Function ? _pages(pagesRef.current) : _pages;
    mutate(() => Object.values(res).filter(isTruthy), {
      revalidate: false
    });
    return res;
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
    refreshPage
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
