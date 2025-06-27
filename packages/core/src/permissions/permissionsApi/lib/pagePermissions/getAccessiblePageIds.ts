import type {
  Page,
  PageOperations,
  PagePermissionLevel,
  PageType,
  Prisma,
  SpaceRole,
  SpaceRoleToRole,
  SpaceSubscriptionTier
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/core/errors';
import type { PagePermissionData, PagesRequest } from '@packages/core/pages';
import type { SpacePermissionFlags } from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';

import { computeSpacePermissions } from '../spacePermissions/computeSpacePermissions';

import { permissionTemplates } from './mapping';

type EvaluatedPage = Pick<Page, 'id' | 'syncWithPageId' | 'bountyId' | 'type' | 'spaceId'> & {
  permissions: {
    userId: string | null;
    roleId: string | null;
    spaceId: string | null;
    public: boolean | null;
    allowDiscovery: boolean | null;
    permissionLevel: PagePermissionLevel;
  }[];
};

const pageTypesForSidebar: PageType[] = [
  'page',
  'board',
  'linked_board',
  'inline_board',
  'inline_linked_board',
  // TODO: remove bounty from this list
  'bounty'
];

function pageSelect() {
  return {
    id: true,
    syncWithPageId: true,
    type: true,
    bountyId: true,
    spaceId: true,
    permissions: {
      select: {
        userId: true,
        permissionLevel: true,
        roleId: true,
        spaceId: true,
        public: true,
        allowDiscovery: true
      }
    }
  };
}

type AvailableRole = { id: string; spaceRolesToRole: SpaceRoleToRole[] };

function isAccessible({
  page,
  availableRoles,
  userId,
  operation,
  spaceRole,
  spacePermissions
}: {
  page: EvaluatedPage;
  availableRoles: AvailableRole[];
  userId?: string;
  spaceRole: SpaceRole | null;
  operation: PageOperations;
  spacePermissions: SpacePermissionFlags;
}): boolean {
  const spaceRoleToUse = spaceRole && spaceRole.spaceId === page.spaceId ? spaceRole : null;

  if (
    spaceRoleToUse?.isAdmin ||
    (page.type !== 'proposal' && page.type !== 'bounty' && spacePermissions.deleteAnyPage)
  ) {
    return true;
  } else if ((page.type === 'bounty' || page.bountyId) && spacePermissions.deleteAnyBounty) {
    return true;
  } else if (!userId || !spaceRoleToUse) {
    return page.permissions.some((p) => pageIsPublicChildorDiscoverable(page, p));
    // Case for pages linked to proposals User should have access to the proposal, as well as the
  } else if (spaceRoleToUse?.isGuest && page.type !== 'proposal') {
    return page.permissions.some(
      (p) =>
        (p.userId === userId && permissionTemplates[p.permissionLevel].includes(operation)) ||
        (p.public && p.allowDiscovery) // same here as above
    );
  } else {
    return page.permissions.some((p) => {
      return (
        (operation === 'read' && pageIsPublicChildorDiscoverable(page, p)) ||
        (p.userId === userId && permissionTemplates[p.permissionLevel].includes(operation)) ||
        (p.spaceId === page.spaceId && permissionTemplates[p.permissionLevel].includes(operation)) ||
        (p.roleId &&
          availableRoles.some((r) => r.id === p.roleId && permissionTemplates[p.permissionLevel].includes(operation)))
      );
    });
  }
}

function pageIsPublicChildorDiscoverable(
  page: EvaluatedPage,
  permission: Pick<PagePermissionData, 'allowDiscovery' | 'public'>
) {
  return permission.public && (page.type === 'bounty' || page.type === 'card' || permission.allowDiscovery);
}

export async function getAccessiblePageIds(input: PagesRequest): Promise<string[]> {
  if (!stringUtils.isUUID(input.spaceId)) {
    throw new InvalidInputError('Valid space ID is required');
  }

  const pageType: Prisma.PageWhereInput['type'] =
    input.filter === 'not_card' || input.filter === 'sidebar_view'
      ? { in: pageTypesForSidebar }
      : input.filter === 'reward'
        ? 'bounty'
        : {
            notIn: ['proposal', 'proposal_notes', 'proposal_template']
          };

  let pageLimit = input.limit ? parseInt(input.limit.toString(), 10) : undefined;
  if (!pageLimit || Number.isNaN(pageLimit) || pageLimit < 1) {
    pageLimit = undefined;
  }
  const space = await prisma.space.findUnique({
    where: {
      id: input.spaceId
    },
    select: {
      id: true,
      publicProposalTemplates: true
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with id ${input.spaceId}`);
  }

  // ref: https://www.postgresql.org/docs/12/functions-textsearch.html
  // ref: https://www.postgresql.org/docs/10/textsearch-controls.html
  // prisma refs: https://github.com/prisma/prisma/issues/8950
  const formattedSearch = input.search ? stringUtils.escapeTsQueryCharactersAndFormatPrismaSearch(input.search) : null;

  let spaceRole: (SpaceRole & { space: { subscriptionTier: SpaceSubscriptionTier | null } }) | null = null;

  if (input.userId) {
    spaceRole = await prisma.spaceRole.findFirst({
      where: {
        userId: input.userId,
        spaceId: input.spaceId
      },
      include: {
        space: {
          select: {
            subscriptionTier: true
          }
        }
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

  let pages: EvaluatedPage[];

  if (formattedSearch) {
    // Search by title and content, prioritize matches by title - TODO: use raw queries to improve performance
    pages = await prisma.page.findMany({
      take: pageLimit,
      where: {
        spaceId: input.spaceId,
        deletedAt: input.archived ? { not: null } : null,
        OR: [
          {
            title: { search: formattedSearch, mode: 'insensitive' }
          },
          {
            contentText: { search: formattedSearch }
          }
        ]
      },
      select: pageSelect()
    });
  } else {
    pages = await prisma.page.findMany({
      take: pageLimit,
      where: {
        spaceId: input.spaceId,
        deletedAt: input.archived ? { not: null } : null,
        type: pageType
      },
      select: pageSelect()
    });
  }

  if (spaceRole?.isAdmin) {
    return pages.map((page) => page.id);
  }

  const spacePermissions = await computeSpacePermissions({
    resourceId: space.id,
    userId: spaceRole?.userId,
    preComputedSpaceRole: spaceRole
  });
  return pages
    .filter((page) => {
      return isAccessible({
        userId: input.userId,
        spaceRole,
        availableRoles,
        operation: input.archived ? 'delete' : 'read',
        page,
        spacePermissions
      });
    })
    .map((page) => page.id);
}
