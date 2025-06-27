import { prisma } from '@charmverse/core/prisma-client';

import { PageNotFoundError } from '../../../errors';
import type { PagesRequest, UpdatePagePermissionDiscoverabilityRequest } from '../../../pages';
import { stringUtils } from '../../../utilities';
import type {
  BulkPagePermissionCompute,
  PageEventTriggeringPermissions,
  PagePermissionAssignment,
  PermissionCompute,
  PermissionResource,
  Resource
} from '../../index';
import { getSpaceInfoViaResource } from '../../index';
import { PagePermissionsClient } from '../lib/pagePermissions/client';
import { bulkComputePagePermissionsForFreeSpace } from '../lib/pagePermissions/freeVersion/bulkComputePagePermissionsForFreeSpace';
import { computePagePermissionsForFreeSpace } from '../lib/pagePermissions/freeVersion/computePagePermissionsForFreeSpace';
import { getAccessiblePageIdsForFreeSpace } from '../lib/pagePermissions/freeVersion/getAccessiblePageIdsForFreeSpace';
import { handleBoardPagePermissionUpdated } from '../lib/pagePermissions/handleBoardPagePermissionUpdated';
import { handlePagePermissionAdded } from '../lib/pagePermissions/handlePagePermissionAdded';

const client = new PagePermissionsClient();

// Base routes ---------------------
export async function computePagePermissions(input: PermissionCompute) {
  const spaceInfo = await getSpaceInfoViaResource({ resourceId: input.resourceId, resourceIdType: 'page' });

  const result = await (spaceInfo.tier === 'free' ? computePagePermissionsForFreeSpace : client.computePagePermissions)(
    {
      resourceId: input.resourceId,
      userId: stringUtils.isUUID(input.userId as string) ? input.userId : undefined
    }
  );
  return result;
}

export async function bulkComputePagePermissions(input: BulkPagePermissionCompute) {
  // Single page in query might be interpreted as string, so we need to convert to array
  const pageIds = typeof input.pageIds === 'string' ? [input.pageIds] : input.pageIds;

  const spaceInfo = await getSpaceInfoViaResource({ resourceId: pageIds[0], resourceIdType: 'page' });
  const result = await (
    spaceInfo.tier === 'free' ? bulkComputePagePermissionsForFreeSpace : client.bulkComputePagePermissions
  )({
    pageIds,
    userId: stringUtils.isUUID(input.userId as string) ? input.userId : undefined
  });
  return result;
}

export async function listIds(input: PagesRequest) {
  const spaceInfo = await getSpaceInfoViaResource({ resourceId: input.spaceId, resourceIdType: 'space' });
  const result = await (
    spaceInfo.permissionType === 'free' ? getAccessiblePageIdsForFreeSpace : client.getAccessiblePageIds
  )({
    ...input,
    userId: stringUtils.isUUID(input.userId as string) ? input.userId : undefined
  } as PagesRequest);
  return result;
}

// Premium routes -----------
export async function upsertPagePermission(input: PagePermissionAssignment) {
  const pageId = input.pageId;

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      type: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  // Count before and after permissions so we don't trigger the event unless necessary
  const permissionsBefore = await prisma.pagePermission.count({
    where: {
      pageId
    }
  });

  const createdPermission = await prisma.$transaction(
    async (tx) => {
      const newPermission = await client.upsertPagePermission({
        pageId,
        permission: input.permission,
        tx
      });

      // Override behaviour, we always cascade board permissions downwards
      if (page.type.match(/board/)) {
        await handleBoardPagePermissionUpdated({ permissionId: newPermission.id, tx });
      }
      // Existing behaviour where we setup permissions after a page permission is added, and account for inheritance conditions
      else {
        const permissionsAfter = await tx.pagePermission.count({
          where: {
            pageId
          }
        });

        if (permissionsAfter > permissionsBefore) {
          await handlePagePermissionAdded({ permissionId: newPermission.id, tx });
        }
      }

      return newPermission;
    },
    {
      timeout: 20000
    }
  );
  return createdPermission;
}

export async function updatePageDiscoverability(input: UpdatePagePermissionDiscoverabilityRequest) {
  await client.updatePagePermissionDiscoverability({
    permissionId: input.permissionId,
    allowDiscovery: input.allowDiscovery
  });
}

export async function deletePagePermission(input: PermissionResource) {
  const result = await client.deletePagePermission(input);
  return result;
}

export async function pagePermissionsList(input: Resource) {
  const result = await client.listPagePermissions(input);
  return result;
}

export async function setupPagePermissionsAfterEvent(input: PageEventTriggeringPermissions) {
  const result = await client.setupPagePermissionsAfterEvent(input);
  return result;
}

export async function lockPagePermissionsToBountyCreator(input: Resource) {
  const result = await client.lockPagePermissionsToBountyCreator(input);
  return result;
}

export async function isBountyPageEditableByApplicants(input: Resource) {
  const result = await client.isBountyPageEditableByApplicants(input);
  return result;
}
