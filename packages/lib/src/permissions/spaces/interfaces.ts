import type { SpaceOperation, SpacePermission } from '@charmverse/core/prisma';

import type {
  AssignablePermissionGroups,
  PermissionAssignee,
  PermissionAssigneeId,
  UserPermissionFlags
} from '../interfaces';

export type SpacePermissionModification<A extends AssignablePermissionGroups | 'any' = 'any'> = Pick<
  SpacePermission,
  'forSpaceId' | 'operations'
> &
  PermissionAssigneeId<A>;

export type SpacePermissionWithAssignee<A extends AssignablePermissionGroups | 'any' = 'any'> = SpacePermission &
  PermissionAssignee<A> &
  PermissionAssigneeId<A>;

export type SpacePermissionFlags = UserPermissionFlags<SpaceOperation>;
