import type { Post } from '@prisma/client';

import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError, InsecureOperationError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';

import type { AvailablePostPermissionFlags } from './forum/interfaces';
import type { PermissionCompute, UserPermissionFlags } from './interfaces';
/**
 * In these types, we use the following naming convention:
 * R - resource type such as a Post
 * F - permission flags type
 */
type ResourceWithSpaceId = { spaceId: string };

type PermissionComputeFn<F> = (request: PermissionCompute) => Promise<F>;

export type PermissionFilteringPolicyFnInput<R, F> = {
  flags: F;
  resource: R;
  userId?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
} & (R extends ResourceWithSpaceId ? { isAdmin?: boolean } : {});

export type PermissionFilteringPolicyFn<R, F> = (input: PermissionFilteringPolicyFnInput<R, F>) => F | Promise<F>;

/**
 * @pfps - permission filtering policy functions - each should be a pure function that returns a fresh set of flags rather than mutating the original flags
 */
type PfpBuilderInput<R, F> = {
  resolver: (input: { resourceId: string }) => Promise<R | null>;
  computeFn: (input: PermissionCompute) => Promise<F>;
  pfps: PermissionFilteringPolicyFn<R, F>[];
};

/**
 * This allows us to build a compute function that will apply permission filtering policies to the result, and keep the inner computation clean of nested if / else patterns
 * @type R - If the resource contains a spaceId, we can auto resolve admin status. In this case, your Permission Filtering Policies can make use of isAdmin
 */
export function buildComputePermissionsWithPermissionFilteringPolicies<R, F>({
  computeFn,
  resolver,
  pfps
}: PfpBuilderInput<R, F>): PermissionComputeFn<F> {
  return async (request: PermissionCompute): Promise<F> => {
    const flags = await computeFn(request);
    const resource = await resolver({ resourceId: request.resourceId });
    if (!resource) {
      throw new DataNotFoundError(`Could not find resource with ID ${request.resourceId}`);
    }

    // After each PFP run, we assign the new set of flag to this variable. Flags should never become true after being false as the compute function assigns the max permissions available
    let applicableFlags = flags;

    // If the resource has a spaceId, we can auto resolve admin status
    let isAdminStatus: boolean | undefined;

    if ((resource as ResourceWithSpaceId).spaceId) {
      isAdminStatus = (
        await hasAccessToSpace({
          spaceId: (resource as ResourceWithSpaceId).spaceId,
          userId: request.userId
        })
      ).isAdmin;
    }

    for (const pfp of pfps) {
      let hasTrueFlag = false;

      const newFlags = await pfp({
        flags: applicableFlags,
        resource,
        userId: request.userId,
        isAdmin: isAdminStatus
      } as PermissionFilteringPolicyFnInput<R & ResourceWithSpaceId, F>);
      // Check the PFP did not add any new flags as true
      // eslint-disable-next-line no-loop-func
      typedKeys(newFlags).forEach((key) => {
        const flagValue = newFlags[key];

        if (flagValue === true) {
          hasTrueFlag = true;
        }

        // Adding true and not true just in case a PFP returns a nullish value instead of false
        if (flagValue === true && applicableFlags[key] !== true) {
          throw new InsecureOperationError(
            `Permission filtering policy ${pfp.name} attempted to add a new permission flag: ${key.toString()}`
          );
        }
      });

      applicableFlags = newFlags;

      // Perform an early return if a PFP results in fully empty permissions
      if (!hasTrueFlag) {
        return applicableFlags;
      }
    }

    return applicableFlags;
  };
}
