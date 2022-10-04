import type { SpaceOperation, SpacePermission } from '@prisma/client';
import { Role, Space, User } from '@prisma/client';

import { RequiredNotNull } from 'lib/utilities/types';

import type { PermissionAssignee, AssignablePermissionGroups, PermissionAssigneeId, UserPermissionFlags } from '../interfaces';

export type SpacePermissionModification<A extends AssignablePermissionGroups | 'any' = 'any'> = Pick<SpacePermission, 'forSpaceId' | 'operations'>
& PermissionAssigneeId<A>

export type SpacePermissionWithAssignee<A extends AssignablePermissionGroups | 'any' = 'any'> = SpacePermission
  & PermissionAssignee<A>
  & PermissionAssigneeId<A>

export type SpacePermissionFlags = UserPermissionFlags<SpaceOperation>
