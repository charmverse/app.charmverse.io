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
import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';
import useIsAdmin from './useIsAdmin';

export type LinkedPage = (Page & {children: LinkedPage[], parent: null | LinkedPage});
type IContext = {
  currentPageId: string,
  pages: Record<string, Page | undefined>,
  setPages: Dispatch<SetStateAction<Record<string, Page | undefined>>>,
  setCurrentPageId: Dispatch<SetStateAction<string>>,
  isEditing: boolean
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
  deletePage: () => undefined as any,
  restorePage: () => undefined as any
});

export function PagesProvider ({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [space] = useCurrentSpace();
  const [pages, setPages] = useState<Record<string, Page | undefined>>({});
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const router = useRouter();
  const [user] = useUser();
  const { data } = useSWR(() => space ? `pages/${space?.id}` : null, () => {
    return charmClient.getPages((space as Space).id);
  }, { refreshInterval });
  const dispatch = useAppDispatch();

  const isAdmin = useIsAdmin();

  async function deletePage (pageId: string) {
    const { pageIds } = await charmClient.deletePage(pageId);
    pageIds.forEach(_pageId => {
      delete pages[_pageId];
    });
    setPages({ ...pages });
    // If the current page has been deleted permanently route to the first alive page
    if (pageIds.includes(currentPageId)) {
      router.push(`/${router.query.domain}/${Object.values(pages).find(page => page?.deletedAt === null)?.path}`);
    }
  }

  async function restorePage (pageId: string, route?: boolean) {
    route = route ?? false;
    const { pageIds } = await charmClient.restorePage(pageId);
    pageIds.forEach(_pageId => {
      if (pages[_pageId]) {
        pages[_pageId] = {
          ...pages[_pageId],
          deletedAt: null
        } as Page;
      }
    });
    setPages({ ...pages });
    if (route) {
      // Without routing the banner doesn't go away, even though we are updating the state :/
      const page = pages[pageId];
      router.push(`/${router.query.domain}/${page?.path}`);
    }
    // TODO: Better focalboard blocks api to only fetch blocks by id
    dispatch(initialLoad());
  }

  useEffect(() => {
    if (data) {
      setPages(data.reduce((acc, page) => ({ ...acc, [page.id]: page }), {}) || {});
    }
  }, [data]);

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
    deletePage,
    restorePage
  }), [currentPageId, isEditing, router, pages, user]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export const usePages = () => useContext(PagesContext);
