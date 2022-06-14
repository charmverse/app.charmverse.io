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

