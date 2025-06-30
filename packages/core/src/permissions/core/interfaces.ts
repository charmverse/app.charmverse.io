import type { SpaceOperation, SpaceRole, SpaceRoleToRole, SpaceSubscriptionTier } from '@charmverse/core/prisma-client';

export type Resource = {
  resourceId: string;
};

export type AssignablePermissionGroups = 'user' | 'role' | 'space' | 'public';

// Public is a pure true / false. We only need to know there is a public group, to know it is true
export type TargetPermissionGroup<G extends AssignablePermissionGroups = AssignablePermissionGroups> =
  G extends 'public' ? { group: 'public' } : { group: G; id: string };

export type PermissionAssignment<T extends AssignablePermissionGroups = AssignablePermissionGroups> = Resource & {
  assignee: TargetPermissionGroup<T>;
};

/**
 * P left in as sometimes we want to specify all false / all true
 */
export type UserPermissionFlags<T extends string, P extends boolean = boolean> = Record<T, P>;

/**
 * This is the data we need to compute permissions for a resource
 * It is an improvement after Permission Compute Request, since we assume that all permission compute methods should be responsible for deciding if an admin override is available for a specific operation
 */
export type PermissionCompute = {
  resourceId: string;
  userId?: string;
};

export type SpaceRoleFields = Pick<SpaceRole, 'id' | 'userId' | 'spaceId' | 'isAdmin' | 'isGuest'>;
/**
 * Undefined means we don't have a valid compute yet
 *
 * Null means we already computed space role, and the target user does not belong to this space
 */
export type PreComputedSpaceRole = {
  preComputedSpaceRole?: (SpaceRoleFields & { space: { subscriptionTier: SpaceSubscriptionTier | null } }) | null;
};

export type PreComputedSpacePermissionFlags = {
  preComputedSpacePermissionFlags?: UserPermissionFlags<SpaceOperation>;
};

export type PreFetchedResource<T = any> = { preFetchedResource?: T };

export type PreFetchedPermissions<P = any> = { preFetchedPermissions?: P[] };

export type PreFetchedUserRoleMemberships = { preFetchedUserRoleMemberships?: Pick<SpaceRoleToRole, 'roleId'>[] };

export type PermissionComputeWithCachedData<T = any, P = any> = PermissionCompute &
  PreComputedSpacePermissionFlags &
  PreComputedSpaceRole &
  PreFetchedResource<T> &
  PreFetchedPermissions<P> &
  PreFetchedUserRoleMemberships;

export type PreComputedPermissionData<T = any> = PreComputedSpacePermissionFlags &
  PreComputedSpaceRole &
  PreFetchedResource<T>;

export type SpaceResourcesRequest = {
  spaceId: string;
  userId?: string;
};

/**
 * @publicOnly If true, ensures that authenticated requests will be treated as unauthenticated requests, only returning publicly available resources
 */
export type AvailableResourcesRequest = SpaceResourcesRequest & {
  publicOnly?: boolean;
};

export interface AbstractPermissions<O extends string> {
  get empty(): UserPermissionFlags<O, false>;
  get full(): UserPermissionFlags<O, true>;
  get operationFlags(): UserPermissionFlags<O>;

  addPermissions(operations: O[] | Partial<UserPermissionFlags<O>>): void;

  hasPermissions(operations: O[]): boolean;
}

export type PermissionResource = {
  permissionId: string;
};
