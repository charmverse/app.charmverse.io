import type { SpaceOperation } from '@charmverse/core/prisma-client';

import type { AssignablePermissionGroups, PermissionAssignment, UserPermissionFlags } from '../core/interfaces';

export type SpacePermissionFlags = UserPermissionFlags<SpaceOperation>;

export type AssignableSpacePermissionGroups = Extract<AssignablePermissionGroups, 'space' | 'role'>;

export type SpacePermissionAssignment = PermissionAssignment<AssignablePermissionGroups> & {
  operations: SpaceOperation[];
};

export type PublicBountyToggle = {
  spaceId: string;
  publicBountyBoard: boolean;
};

export type SpaceDefaultPublicPageToggle = {
  spaceId: string;
  defaultPublicPages: boolean;
};
