import { prisma } from '@charmverse/core/prisma-client';
import { PageNotFoundError } from '@packages/core/errors';
import type { PagesRequest, UpdatePagePermissionDiscoverabilityRequest } from '@packages/core/pages';
import type {
  BulkPagePermissionCompute,
  PageEventTriggeringPermissions,
  PagePermissionAssignment,
  PermissionCompute,
  PermissionResource,
  Resource
} from '@packages/core/permissions';
import { getSpaceInfoViaResource } from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';
import Router from 'koa-router';
import { isQueryValueTrue } from 'server';

import { PagePermissionsClient } from 'lib/pagePermissions/client';
import { bulkComputePagePermissionsForFreeSpace } from 'lib/pagePermissions/freeVersion/bulkComputePagePermissionsForFreeSpace';
import { computePagePermissionsForFreeSpace } from 'lib/pagePermissions/freeVersion/computePagePermissionsForFreeSpace';
import { getAccessiblePageIdsForFreeSpace } from 'lib/pagePermissions/freeVersion/getAccessiblePageIdsForFreeSpace';
import { handleBoardPagePermissionUpdated } from 'lib/pagePermissions/handleBoardPagePermissionUpdated';
import { handlePagePermissionAdded } from 'lib/pagePermissions/handlePagePermissionAdded';

const client = new PagePermissionsClient();

const router = new Router({
  prefix: '/api/pages'
});

// Base routes ---------------------
router.get('/compute-page-permissions', async (ctx) => {
  const input = ctx.request.query as any as PermissionCompute;

  const spaceInfo = await getSpaceInfoViaResource({ resourceId: input.resourceId, resourceIdType: 'page' });

  const result = await (spaceInfo.tier === 'free' ? computePagePermissionsForFreeSpace : client.computePagePermissions)(
    {
      resourceId: input.resourceId,
      userId: stringUtils.isUUID(input.userId as string) ? input.userId : undefined
    }
  );
  ctx.body = result;
});

router.get('/bulk-compute-page-permissions', async (ctx) => {
  const input = ctx.request.query as any as BulkPagePermissionCompute;

  // Single page in query might be interpreted as string, so we need to convert to array
  const pageIds = typeof input.pageIds === 'string' ? [input.pageIds] : input.pageIds;

  const spaceInfo = await getSpaceInfoViaResource({ resourceId: pageIds[0], resourceIdType: 'page' });
  const result = await (
    spaceInfo.tier === 'free' ? bulkComputePagePermissionsForFreeSpace : client.bulkComputePagePermissions
  )({
    pageIds,
    userId: stringUtils.isUUID(input.userId as string) ? input.userId : undefined
  });
  ctx.body = result;
});

router.get('/list-ids', async (ctx) => {
  // Issue with pageIds prop. We might just drop this for now
  const input = ctx.request.query as any as PagesRequest;
  const spaceInfo = await getSpaceInfoViaResource({ resourceId: input.spaceId, resourceIdType: 'space' });
  const result = await (
    spaceInfo.permissionType === 'free' ? getAccessiblePageIdsForFreeSpace : client.getAccessiblePageIds
  )({
    ...input,
    userId: stringUtils.isUUID(input.userId as string) ? input.userId : undefined
  } as PagesRequest);
  ctx.status = 200;
  ctx.body = result;
});

// Premium routes -----------
router.post('/upsert-page-permission', async (ctx) => {
  const input = ctx.request.body as PagePermissionAssignment;
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
  ctx.status = 201;
  ctx.body = createdPermission;
});

router.put('/update-page-discoverability', async (ctx) => {
  const input = ctx.request.body as UpdatePagePermissionDiscoverabilityRequest;

  await client.updatePagePermissionDiscoverability({
    permissionId: input.permissionId,
    allowDiscovery: input.allowDiscovery
  });
  ctx.response.status = 200;
});

router.delete('/delete-page-permission', async (ctx) => {
  const input = ctx.request.body as any as PermissionResource;

  const result = await client.deletePagePermission(input);

  ctx.body = result;
});

router.get('/page-permissions-list', async (ctx) => {
  const input = ctx.request.query as Resource;

  const result = await client.listPagePermissions(input);
  ctx.status = 200;
  ctx.body = result;
});
router.post('/setup-page-permissions-after-event', async (ctx) => {
  const input = ctx.request.body as PageEventTriggeringPermissions;

  const result = await client.setupPagePermissionsAfterEvent(input);
  ctx.status = 204;
  ctx.body = result;
});

router.post('/lock-page-permissions-to-bounty-creator', async (ctx) => {
  const input = ctx.request.body as Resource;

  const result = await client.lockPagePermissionsToBountyCreator(input);
  ctx.body = result;
});

router.get('/is-bounty-page-editable-by-applicants', async (ctx) => {
  const input = ctx.request.query as Resource;

  const result = await client.isBountyPageEditableByApplicants(input);

  ctx.status = 200;
  ctx.body = result;
});

export const pagePermissionsRouter = router;
