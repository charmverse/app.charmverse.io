import { Page, PageOperations, Role } from '@prisma/client';
import charmClient from 'charmClient';
import { IPageWithPermissions } from 'lib/pages';
import { IPagePermissionFlags, PageOperationType } from 'lib/permissions/pages';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import { permissionTemplates } from 'lib/permissions/pages/page-permission-mapping';
import { useRouter } from 'next/router';
import * as React from 'react';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

export type LinkedPage = (Page & {children: LinkedPage[], parent: null | LinkedPage});
type IContext = {
  currentPageId: string,
  pages: Record<string, Page | undefined>,
  setPages: Dispatch<SetStateAction<Record<string, Page | undefined>>>,
  deletedPages: Record<string, Page | undefined>,
  setDeletedPages: Dispatch<SetStateAction<Record<string, Page | undefined>>>,
  setCurrentPageId: Dispatch<SetStateAction<string>>,
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
  getPagePermissions: (pageId: string) => IPagePermissionFlags,
};

const refreshInterval = 1000 * 5 * 60; // 5 minutes

export const PagesContext = createContext<Readonly<IContext>>({
  currentPageId: '',
  pages: {},
  deletedPages: {},
  setDeletedPages: () => undefined,
  setCurrentPageId: () => '',
  setPages: () => undefined,
  isEditing: true,
  setIsEditing: () => { },
  getPagePermissions: () => new AllowedPagePermissions()
});

export function PagesProvider ({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [space] = useCurrentSpace();
  const [pages, setPages] = useState<Record<string, Page | undefined>>({});
  const [deletedPages, setDeletedPages] = useState<Record<string, Page | undefined>>({});
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const router = useRouter();
  const [user] = useUser();
  const { data } = useSWR(() => space ? `pages/${space?.id}` : null, (e) => {
    return charmClient.getPages(space!.id);
  }, { refreshInterval });
  const { data: deletedPagesResponse } = useSWR(() => space ? `pages/deleted/${space?.id}` : null, () => {
    return charmClient.getDeletedPages(space!.id);
  });
  useEffect(() => {
    if (data) {
      setPages(data.reduce((acc, page) => ({ ...acc, [page.id]: page }), {}) || {});
    }
  }, [data]);

  useEffect(() => {
    if (deletedPagesResponse) {
      setDeletedPages(deletedPagesResponse.reduce((acc, page) => ({ ...acc, [page.id]: page }), {}) || {});
    }
  }, [deletedPagesResponse]);

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

    // TEMPORARY TILL WE FIX SPACE PROVISIONING
    if (userSpaceRole?.role === 'admin' || userSpaceRole?.isAdmin === true) {
      computedPermissions.addPermissions(Object.keys(PageOperations) as PageOperationType []);
      return computedPermissions;
    }

    const applicableRoles: Role [] = userSpaceRole?.spaceRoleToRole?.map(spaceRoleToRole => spaceRoleToRole.role) ?? [];

    targetPage.permissions?.forEach(permission => {

      // User gets permission via role or as an individual
      const shouldApplyPermission = (permission.userId && permission.userId === user?.id)
        || (permission.roleId && applicableRoles.some(role => role.id === permission.roleId))
        || (userSpaceRole && permission.spaceId === userSpaceRole.spaceId);

      if (shouldApplyPermission) {

        const permissionsToEnable = permission.permissionLevel === 'custom' ? permission.permissions : permissionTemplates[permission.permissionLevel];

        computedPermissions.addPermissions(permissionsToEnable);
      }
    });

    return computedPermissions;
  }

  const value: IContext = useMemo(() => ({
    currentPageId,
    isEditing,
    setIsEditing,
    pages,
    setCurrentPageId,
    setPages,
    getPagePermissions,
    deletedPages,
    setDeletedPages
  }), [deletedPages, currentPageId, isEditing, router, pages, user]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export const usePages = () => useContext(PagesContext);
