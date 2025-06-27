import type { PermissionCompute, PublicBountyToggle, SpaceDefaultPublicPageToggle } from '@packages/core/permissions';
import { getSpaceInfoViaResource } from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';
import Router from 'koa-router';

import { SpacePermissionsClient } from 'lib/spacePermissions/client';
import { computeSpacePermissionsForFreeSpace } from 'lib/spacePermissions/freeVersion/computeSpacePermissionsForFreeSpace';

const client = new SpacePermissionsClient();

const router = new Router({
  prefix: '/api/spaces'
});

// Base routes ---------------------
router.get('/compute-space-permissions', async (ctx) => {
  const input = ctx.request.query as PermissionCompute;

  const spaceInfo = await getSpaceInfoViaResource({
    resourceId: input.resourceId,
    resourceIdType: 'space'
  });

  const result = await (
    spaceInfo.tier === 'free' ? computeSpacePermissionsForFreeSpace : client.computeSpacePermissions
  )({
    resourceId: input.resourceId,
    // Sanitise value from HTTP request since it is sometimes 'undefined'
    userId: !stringUtils.isUUID(input.userId as string) ? undefined : input.userId
  });
  ctx.body = result;
});

router.post('/toggle-default-public-page', async (ctx) => {
  const input = ctx.request.body as SpaceDefaultPublicPageToggle;

  const result = await client.toggleSpaceDefaultPublicPage(input);
  ctx.body = result;
});

router.post('/toggle-public-bounties', async (ctx) => {
  const input = ctx.request.body as PublicBountyToggle;

  const result = await client.togglePublicBounties(input);
  ctx.body = result;
});

export const spacePermissionsRouter = router;
