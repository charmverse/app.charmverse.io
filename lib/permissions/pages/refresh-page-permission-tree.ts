import { PagePermission } from '@prisma/client';
import { prisma } from 'db';
import { PageNotFoundError } from 'lib/public-api';
import { AllowedPagePermissions } from './available-page-permissions.class';
import { IPageWithPermissions } from './page-permission-interfaces';
import { permissionTemplates } from './page-permission-mapping';
import { createPagePermission } from './page-permission-actions';

/**
 * Ensures that a set of comparison permissions contains at least the same or more permissions than the base compared against
 * @abstract There can only be 1 page permission per space, role or user. This is enforced at the database level
 */
export function hasFullSetOfBasePermissions (basePermissions: PagePermission [], comparisonPermissions: PagePermission []): boolean {

  for (const permission of basePermissions) {
    const comparisonPermission = comparisonPermissions.find(permissionToCompare => {

      if (permission.spaceId) {
        return permissionToCompare.spaceId === permission.spaceId;
      }
      else if (permission.roleId) {
        return permissionToCompare.roleId === permission.roleId;
      }
      else if (permission.userId) {
        return permissionToCompare.userId === permission.userId;
      }
      else {
        return false;
      }

    });

    if (!comparisonPermission) {
      return false;
    }

    const availableCompare = new AllowedPagePermissions(comparisonPermission.permissionLevel === 'custom' ? comparisonPermission.permissions : permissionTemplates[permission.permissionLevel]);

    const hasSameOrMore = availableCompare.hasPermissions(permission.permissionLevel === 'custom' ? permission.permissions : permissionTemplates[permission.permissionLevel]);

    if (hasSameOrMore === false) {
      return false;
    }

  }

  return true;

}

/**
 * @param permissionIdToIgnore A permission Id that will not be compared. Useful when we've just added a new permission and are evaluating children to see if they can inherit it
 */
export async function canInheritPermissionsFromParent (pageId: string, permissionIdToIgnore?: string) {

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    include: {
      permissions: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  // Is a root page
  if (!page.parentId) {
    return false;
  }

  const parentPage = await prisma.page.findUnique({
    where: {
      id: page.parentId
    },
    include: {
      permissions: true
    }
  });

  if (!parentPage) {
    throw new PageNotFoundError(page.parentId);
  }

  const filteredParentPermissions = permissionIdToIgnore ? parentPage.permissions.filter(perm => {
    return perm.id !== permissionIdToIgnore && perm.inheritedFromPermission !== permissionIdToIgnore;
  }) : parentPage.permissions;

  const filteredPagePermissions = permissionIdToIgnore ? page.permissions.filter(perm => {
    return perm.id !== permissionIdToIgnore && perm.inheritedFromPermission !== permissionIdToIgnore;
  }) : page.permissions;

  return hasFullSetOfBasePermissions(filteredParentPermissions, filteredPagePermissions);

}

/**
 * Takes all permissions for a page and makes the page the owner of those permissions
 * Updates children to inherit from this page
 */
export async function breakInheritance (pageId: string): Promise<IPageWithPermissions> {
  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    include: {
      permissions: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const updatedPermissions = await Promise.all(page.permissions.map(permission => {
    return createPagePermission({
      ...permission,
      inheritedFromPermission: null
    });
  }));

  page.permissions = updatedPermissions;

  return page;
}

/**
 * Returned a flattened list of all a page's children
 * @param pageId
 */
export async function resolveChildPages (pageId: string): Promise<IPageWithPermissions []> {
  const children = await prisma.page.findMany({
    where: {
      parentId: pageId
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  const nestedChildren = await Promise.all(children.map(childPage => {
    return resolveChildPages(childPage.id);
  }));

  // Merge the results
  const flattenedChildren: IPageWithPermissions [] = [...children];

  nestedChildren.forEach(nestedSet => {
    flattenedChildren.push(...nestedSet);
  });

  return flattenedChildren;
}

/**
 * Update all page permissions to the parent permissions
 * @param pageId
 * @param triggeringPermissionId The permission Id we want to add
 */
/*
export async function syncChildPermissions (pageId: string, triggeringPermissionId: string): Promise<IPageWithPermissions & {children: IPageWithPermissions []}> {
  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    include: {
      permissions: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const children = await prisma.page.findMany({
    where: {
      parentId: page.id
    },
    include: {
      permissions: true
    }
  });
}
*/
