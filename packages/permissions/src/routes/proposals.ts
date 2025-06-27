import type { PermissionCompute, Resource, SpaceResourcesRequest } from '@packages/core/permissions';
import { getSpaceInfoViaResource } from '@packages/core/permissions';
import type { ListProposalsRequest } from '@packages/core/proposals';
import { stringUtils } from '@packages/core/utilities';
import Router from 'koa-router';
import { isQueryValueTrue } from 'server';

import { ProposalPermissionsClient } from 'lib/proposalPermissions/client';
import { computeProposalEvaluationPermissionsForFreeSpace } from 'lib/proposalPermissions/freeVersion/computeProposalEvaluationPermissionsForFreeSpace';
import { getAccessibleProposalIdsForFreeSpace } from 'lib/proposalPermissions/freeVersion/getAccessibleProposalIdsForFreeSpace';

const client = new ProposalPermissionsClient();

const router = new Router({
  prefix: '/api/proposals'
});

// Base routes ---------------------
router.get('/list-ids', async (ctx) => {
  const input = ctx.request.query as any as ListProposalsRequest;

  const spaceInfo = await getSpaceInfoViaResource({
    resourceId: input.spaceId,
    resourceIdType: 'space'
  });

  const result = await (
    spaceInfo.permissionType === 'free' ? getAccessibleProposalIdsForFreeSpace : client.getAccessibleProposalIds
  )({
    ...input,
    userId: stringUtils.isUUID(input.userId as string) ? input.userId : undefined,
    onlyAssigned: isQueryValueTrue({ query: input, key: 'onlyAssigned' })
  } as ListProposalsRequest);

  ctx.body = result;
});

router.get('/compute-proposal-permissions', async (ctx) => {
  const input = ctx.request.query as any as PermissionCompute;

  const spaceInfo = await getSpaceInfoViaResource({
    resourceId: input.resourceId,
    resourceIdType: 'proposal'
  });

  const result = await (
    spaceInfo.tier === 'free' ? computeProposalEvaluationPermissionsForFreeSpace : client.computeProposalPermissions
  )({
    ...input,
    // Sanitise value from HTTP request since it is sometimes 'undefined'
    userId: !stringUtils.isUUID(input.userId as string) ? undefined : input.userId
  } as PermissionCompute);
  ctx.body = result;
});

router.get('/compute-base-proposal-permissions', async (ctx) => {
  const input = ctx.request.query as any as PermissionCompute;

  const spaceInfo = await getSpaceInfoViaResource({
    resourceId: input.resourceId,
    resourceIdType: 'proposal'
  });
  const result = await (
    spaceInfo.tier === 'free' ? computeProposalEvaluationPermissionsForFreeSpace : client.computeBaseProposalPermissions
  )({
    resourceId: input.resourceId,
    // Sanitise value from HTTP request since it is sometimes 'undefined'
    userId: !stringUtils.isUUID(input.userId as string) ? undefined : input.userId
  });
  ctx.body = result;
});

router.get('/compute-all-proposal-evaluation-permissions', async (ctx) => {
  const input = ctx.request.query as PermissionCompute;

  const result = await client.computeAllProposalEvaluationPermissions({
    resourceId: input.resourceId,
    // Sanitise value from HTTP request since it is sometimes 'undefined'
    userId: !stringUtils.isUUID(input.userId as string) ? undefined : input.userId
  });
  ctx.body = result;
});

router.get('/bulk-compute-proposal-permissions', async (ctx) => {
  const input = ctx.request.query as any as SpaceResourcesRequest;

  const result = await client.bulkComputeProposalPermissions({
    spaceId: input.spaceId,
    userId: stringUtils.isUUID(input.userId as string) ? input.userId : undefined
  });
  ctx.body = result;
});

export const proposalPermissionsRouter = router;
