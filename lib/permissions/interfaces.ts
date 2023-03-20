import type { PagePermission, Role, Space, User } from '@prisma/client';

export type Resource = {
  resourceId: string;
};

export type AssignablePermissionGroups = 'user' | 'role' | 'space' | 'any';

export type PermissionAssigneeId<A extends AssignablePermissionGroups = 'any'> = A extends 'any'
  ? {
      spaceId?: string | null | undefined;
      roleId?: string | null | undefined;
      userId?: string | null | undefined;
    }
  : A extends 'user'
  ? { userId: string; roleId?: undefined | null; spaceId?: undefined | null }
  : // Default case for when we don't know yet
  A extends 'role'
  ? { userId?: undefined | null; roleId: string; spaceId?: undefined | null }
  : A extends 'space'
  ? { userId?: undefined | null; roleId?: undefined | null; spaceId: string }
  : never;

export type PermissionAssignee<A extends AssignablePermissionGroups = 'any'> = A extends 'any'
  ? {
      space?: Space;
      role?: Role;
      user?: User;
    }
  : // Default case for when we don't know yet
  A extends 'user'
  ? { user: User; role?: null | undefined; space?: null | undefined }
  : A extends 'role'
  ? { user?: null | undefined; role: Role; space?: null | undefined }
  : A extends 'space'
  ? { user?: null | undefined; role?: null | undefined; space: Space }
  : never;

/**
 * P left in as sometimes we want to specify all false / all true
 */
export type UserPermissionFlags<T extends string, P extends boolean = boolean> = Record<T, P>;

/**
 * Required data for calculating operations a user can access relating to a resource
 * @allowAdminBypass - If true, compute should return full privileges if user is an admin
 * @resourceId - ID of the entity, such as a page or a space
 * userId is optional as we can also request unquthenticated permissions for a resource
 */
export interface PermissionComputeRequest {
  resourceId: string;
  allowAdminBypass: boolean;
  userId?: string;
}

/**
 * This is the data we need to compute permissions for a resource
 * It is an improvement after Permission Compute Request, since we assume that all permission compute methods should be responsible for deciding if an admin override is available for a specific operation
 */
export type PermissionCompute = {
  resourceId: string;
  userId?: string;
};

/**
 * @id The userId, roleId or spaceId
 * @resourceId The resource such as Space or Page we are querying permissions for
 */
export interface AssignedPermissionsQuery {
  group: AssignablePermissionGroups;
  id: string;
  resourceId: string;
}

// Version of above interfaces that allows for public to be specified
export type AssignablePermissionGroupsWithPublic = AssignablePermissionGroups | 'public';

// Public is a pure true / false. We only need to know there is a public group, to know it is true
export type TargetPermissionGroup<
  G extends Exclude<AssignablePermissionGroupsWithPublic, 'any'> = Exclude<AssignablePermissionGroupsWithPublic, 'any'>
> = G extends 'public' ? { group: 'public' } : { group: G; id: string };

// A permission mapping is a mapping of a permission group to a list of operations
// Example is page permission {editor: ['view', 'edit', 'comment']}
export type OperationGroupMapping<G extends string, O extends string> = { [key in G]: Readonly<O[]> };

/**
 * @publicOnly If true, ensures that authenticated requests will be treated as unauthenticated requests, only returning publicly available resources
 */
export interface AvailableResourcesRequest {
  spaceId: string;
  userId?: string;
  publicOnly?: boolean;
}

export type PagePermissionMeta = Omit<PagePermission, 'inheritedFromPermission'>;

export interface AbstractPermissions<O extends string> {
  get empty(): UserPermissionFlags<O, false>;
  get full(): UserPermissionFlags<O, true>;
  get operationFlags(): UserPermissionFlags<O>;

  addPermissions(operations: O[] | Partial<UserPermissionFlags<O>>): void;

  hasPermissions(operations: O[]): boolean;
}

export type PermissionToDelete = {
  permissionId: string;
};
