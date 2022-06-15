import { Role, Space, User } from '@prisma/client';

export type AssignablePermissionGroups = 'user' | 'role' | 'space'

export type PermissionAssigneeId<A extends AssignablePermissionGroups = AssignablePermissionGroups> =
  A extends 'user' ? {userId: string, roleId?: undefined | null, spaceId?: undefined | null}
  // Default case for when we don't know yet
  : A extends 'role' ? {userId?: undefined | null, roleId: string, spaceId?: undefined | null}
  : A extends 'space' ? {userId?: undefined | null, roleId?: undefined | null, spaceId: string}
  : {
    spaceId?: string | null,
    roleId?: string | null
    userId?: string | null
  }

export type PermissionAssignee<A extends AssignablePermissionGroups = AssignablePermissionGroups> =
  // Default case for when we don't know yet
  A extends 'user' ? {user: User, role?: null | undefined, space?: null | undefined}
  : A extends 'role' ? {user?: null | undefined, role: Role, space?: null | undefined}
  : A extends 'space' ? {user?: null | undefined, role?: null | undefined, space: Space}
  : {
    space?: Space,
    role?: Role
    user?: User
  }

export type UserPermissionFlags<T extends string> = Record<T, boolean>

/**
 * Required data for calculating operations a user can access relating to a resource
 * @allowAdminBypass - If true, compute should return full privileges if user is an admin
 * @resourceId - ID of the entity, such as a page or a space
 */
export interface PermissionComputeRequest {
  resourceId: string
  allowAdminBypass: boolean
  userId: string
}

/**
 * @id The userId, roleId or spaceId
 * @resourceId The resource such as Space or Page we are querying permissions for
 */
export interface AssignedPermissionsQuery {
  group: AssignablePermissionGroups,
  id: string
  resourceId: string
}
