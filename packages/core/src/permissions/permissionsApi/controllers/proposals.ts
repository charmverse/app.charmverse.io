import type { PermissionCompute, Resource, SpaceResourcesRequest } from '@packages/core/permissions';
import { getSpaceInfoViaResource } from '@packages/core/permissions';
import type { ListProposalsRequest } from '@packages/core/proposals';
import { stringUtils } from '@packages/core/utilities';

import { ProposalPermissionsClient } from '../lib/proposalPermissions/client';
import { computeProposalEvaluationPermissionsForFreeSpace } from '../lib/proposalPermissions/freeVersion/computeProposalEvaluationPermissionsForFreeSpace';
import { getAccessibleProposalIdsForFreeSpace } from '../lib/proposalPermissions/freeVersion/getAccessibleProposalIdsForFreeSpace';

const client = new ProposalPermissionsClient();

// Base routes ---------------------
export async function listIds(input: ListProposalsRequest) {
  const spaceInfo = await getSpaceInfoViaResource({
    resourceId: input.spaceId,
    resourceIdType: 'space'
  });

  const result = await (
    spaceInfo.permissionType === 'free' ? getAccessibleProposalIdsForFreeSpace : client.getAccessibleProposalIds
  )({
    ...input,
    userId: stringUtils.isUUID(input.userId as string) ? input.userId : undefined,
    onlyAssigned: typeof input.onlyAssigned === 'string' ? input.onlyAssigned === 'true' : input.onlyAssigned === true
  } as ListProposalsRequest);

  return result;
}

export async function computeProposalPermissions(input: PermissionCompute) {
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
  return result;
}

export async function computeBaseProposalPermissions(input: PermissionCompute) {
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
  return result;
}

export async function computeAllProposalEvaluationPermissions(input: PermissionCompute) {
  const result = await client.computeAllProposalEvaluationPermissions({
    resourceId: input.resourceId,
    // Sanitise value from HTTP request since it is sometimes 'undefined'
    userId: !stringUtils.isUUID(input.userId as string) ? undefined : input.userId
  });
  return result;
}

export async function bulkComputeProposalPermissions(input: SpaceResourcesRequest) {
  const result = await client.bulkComputeProposalPermissions({
    spaceId: input.spaceId,
    userId: stringUtils.isUUID(input.userId as string) ? input.userId : undefined
  });
  return result;
}
