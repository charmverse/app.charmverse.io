import type { Post } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';

import type { AvailablePostPermissionFlags } from './forum/interfaces';
import type { PermissionCompute, UserPermissionFlags } from './interfaces';

type QueryableResource = 'post';
type LinkedResourceType<R extends QueryableResource> = R extends 'post'
  ? Pick<Post, 'id' | 'spaceId' | 'createdBy' | 'proposalId'>
  : never;
type Flags<R extends QueryableResource> = R extends 'post' ? AvailablePostPermissionFlags : never;

type PermissionComputeFn<R extends QueryableResource> = (request: PermissionCompute) => Promise<Flags<R>>;
export type PermissionFilteringPolicyFnInput<R extends QueryableResource> = {
  flags: Flags<R>;
  resource: LinkedResourceType<R>;
  userId?: string;
};

export type PermissionFilteringPolicyFn<R extends QueryableResource> = (
  input: PermissionFilteringPolicyFnInput<R>
) => Promise<Flags<R>>;

/**
 * @pfps - permission filtering policy functions - each should be a pure function that returns a fresh set of flags rather than mutating the original flags
 */
type PfpBuilderInput<R extends QueryableResource> = {
  resourceType: R;
  computeFn: (input: PermissionCompute) => Promise<Flags<R>>;
  pfps: PermissionFilteringPolicyFn<R>[];
};

/**
 * This allows us to build a compute function that will apply permission filtering policies to the result, and keep the inner computation clean of nested if / else patterns
 */
export function buildComputePermissionsWithPermissionFilteringPolicies<R extends QueryableResource>({
  computeFn,
  pfps,
  resourceType
}: PfpBuilderInput<R>): PermissionComputeFn<R> {
  return async (request: PermissionCompute): Promise<Flags<R>> => {
    const flags = await computeFn(request);
    const resource = (await prisma[resourceType].findUnique({
      where: { id: request.resourceId },
      select: {
        id: true,
        spaceId: true,
        createdBy: true,
        proposalId: true
      }
    })) as LinkedResourceType<R>;
    if (!resource) {
      throw new DataNotFoundError(`Could not find ${resourceType} with ID ${request.resourceId}`);
    }

    let refreshedFlags = flags;

    for (const pfp of pfps) {
      refreshedFlags = await pfp({ flags: refreshedFlags, resource, userId: request.userId });
    }

    return refreshedFlags;
  };
}
