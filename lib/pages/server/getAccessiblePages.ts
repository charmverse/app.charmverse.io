import type { PageOperations, Prisma, SpaceRole, SpaceRoleToRole } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { checkSpaceSpaceSubscriptionInfo } from 'lib/permissions/api/routers';
import type { PagePermissionMeta } from 'lib/permissions/interfaces';
import { permissionTemplates } from 'lib/permissions/pages';

import type { IPageWithPermissions, PageMeta, PageNodeWithPermissions } from '../interfaces';

type PermissionsSelect = Record<keyof PagePermissionMeta, true>;
type PageFieldsWithoutContent = Record<keyof PageMeta, true>;
type PagesRequest = {
  spaceId: string;
  userId?: string;
  archived?: boolean;
  pageIds?: string[];
  search?: string;
  limit?: number;
};

/**
 * Utility for getting permissions of a page
 * @returns
 */
export function includePagePermissions(): Prisma.PageInclude & {
  permissions: {
    include: {
      sourcePermission: true;
    };
  };
} {
  return {
    permissions: {
      include: {
        sourcePermission: true
      }
    }
  };
}

export function includePagePermissionsMeta(): { permissions: { select: PermissionsSelect } } {
  return {
    permissions: {
      select: {
        pageId: true,
        userId: true,
        id: true,
        permissionLevel: true,
        permissions: true,
        roleId: true,
        spaceId: true,
        public: true
      }
    }
  };
}

function selectPageFields() {
  const select: { select: PageFieldsWithoutContent } = {
    select: {
      id: true,
      deletedAt: true,
      createdAt: true,
      createdBy: true,
      updatedAt: true,
      updatedBy: true,
      title: true,
      headerImage: true,
      icon: true,
      path: true,
      parentId: true,
      spaceId: true,
      type: true,
      boardId: true,
      index: true,
      cardId: true,
      proposalId: true,
      bountyId: true,
      hasContent: true,
      galleryImage: true,
      deletedBy: true,
      ...includePagePermissionsMeta()
    }
  };

  return select;
}

type AvailableRole = { id: string; spaceRolesToRole: SpaceRoleToRole[] };

function isAccessible({
  page,
  availableRoles,
  userId,
  operation,
  spaceRole
}: {
  page: PageNodeWithPermissions;
  availableRoles: AvailableRole[];
  userId?: string;
  spaceRole: SpaceRole | null;
  operation: PageOperations;
}): boolean {
  const spaceRoleToUse = spaceRole && spaceRole.spaceId === page.spaceId ? spaceRole : null;

  if (spaceRoleToUse?.isAdmin) {
    return true;
  } else if (!userId || !spaceRoleToUse) {
    return page.permissions.some((p) => (operation === 'read' ? p.public : false));
  } else if (spaceRoleToUse?.isGuest) {
    return page.permissions.some(
      (p) =>
        (operation === 'read' ? p.public : false) ||
        (p.userId === userId && permissionTemplates[p.permissionLevel].includes(operation))
    );
  } else {
    return page.permissions.some(
      (p) =>
        (operation === 'read' ? p.public : false) ||
        (p.userId === userId && permissionTemplates[p.permissionLevel].includes(operation)) ||
        (p.spaceId === page.spaceId && permissionTemplates[p.permissionLevel].includes(operation)) ||
        (p.roleId &&
          availableRoles.some((r) => r.id === p.roleId && permissionTemplates[p.permissionLevel].includes(operation)))
    );
  }
}

export async function getAccessiblePages(input: PagesRequest): Promise<PageMeta[]> {
  // ref: https://www.postgresql.org/docs/12/functions-textsearch.html
  // ref: https://www.postgresql.org/docs/10/textsearch-controls.html
  // prisma refs: https://github.com/prisma/prisma/issues/8950
  const formattedSearch = input.search
    ? `${input.search
        .split(/\s/)
        .filter((s) => s)
        .join(' & ')}:*`
    : undefined;

  let spaceRole: SpaceRole | null = null;

  // ---- Bypass page permissions and load the pages for free spaces
  // TODO: remove this once we provide split implementations for free and paid spaces
  const permissionsMode = await checkSpaceSpaceSubscriptionInfo({
    resourceId: input.spaceId,
    resourceIdType: 'space'
  });

  if (permissionsMode.tier === 'free') {
    return prisma.page.findMany({
      where: {
        spaceId: input.spaceId,
        deletedAt: input.archived ? { not: null } : null,
        title: formattedSearch ? { search: formattedSearch } : undefined
      },
      ...selectPageFields()
    });
  }

  // Resume normal function
  if (input.userId) {
    spaceRole = await prisma.spaceRole.findFirst({
      where: {
        userId: input.userId,
        spaceId: input.spaceId
      }
    });

    // Not a space member, make userId undefined
    if (!spaceRole) {
      input.userId = undefined;
    }
  }

  const availableRoles: AvailableRole[] =
    input.userId && spaceRole && !spaceRole.isGuest
      ? await prisma.role.findMany({
          where: {
            spaceId: input.spaceId,
            spaceRolesToRole: {
              some: {
                spaceRole: {
                  userId: input.userId
                }
              }
            }
          },
          select: {
            id: true,
            spaceRolesToRole: true
          }
        })
      : [];

  let pages: IPageWithPermissions[];

  if (input.search) {
    // Search by title and content, prioritize matches by title - TODO: use raw queries to improve performance
    const [pagesByTitle, pagesByContent] = await Promise.all([
      prisma.page.findMany({
        where: {
          title: { search: formattedSearch },
          spaceId: input.spaceId,
          deletedAt: input.archived ? { not: null } : null
        },
        ...selectPageFields()
      }),
      prisma.page.findMany({
        where: {
          contentText: { search: formattedSearch },
          spaceId: input.spaceId,
          deletedAt: input.archived ? { not: null } : null
        },
        ...selectPageFields()
      })
    ]);
    pages = [...pagesByTitle, ...pagesByContent.filter((page) => !pagesByTitle.some((p) => p.id === page.id))].slice(
      0,
      input.limit
    ) as IPageWithPermissions[];
  } else {
    pages = (await prisma.page.findMany({
      where: {
        spaceId: input.spaceId,
        deletedAt: input.archived ? { not: null } : null
      },
      ...selectPageFields()
    })) as IPageWithPermissions[];
  }

  if (spaceRole?.isAdmin) {
    const pagesWithoutPermissions: PageMeta[] = pages.map(getPageMeta);
    return pagesWithoutPermissions;
  }

  const filteredPages: PageMeta[] = pages
    .filter((page) => {
      if (spaceRole && (page.type === 'proposal_template' || page.type === 'proposal')) {
        return true;
      }

      return isAccessible({
        userId: input.userId,
        spaceRole,
        availableRoles,
        operation: input.archived ? 'delete' : 'read',
        page
      });
    })
    .map(getPageMeta);

  return filteredPages;
}

function getPageMeta(page: IPageWithPermissions): PageMeta {
  delete (page as any).permissions;
  // eslint-disable-next-line guard-for-in
  for (const propName in page) {
    const typedPropName = propName as keyof IPageWithPermissions;
    if (page[typedPropName] === null) delete page[typedPropName];
  }
  return page;
}
