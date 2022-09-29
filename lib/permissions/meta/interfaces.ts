import type { Space, SpaceOperation, SpacePermissionConfigurationMode } from '@prisma/client';

export interface SpacePermissionConfigurationUpdate {
  spaceId: string;
  permissionConfigurationMode: SpacePermissionConfigurationMode;
}
export type SpaceConfigurationPreset = Exclude<SpacePermissionConfigurationMode, 'custom'>

export interface SpacePermissionTemplate {
  spaceOperations: Record<SpaceOperation, boolean>;
  pagePermissionDefaults: Pick<Space, 'defaultPagePermissionGroup' | 'defaultPublicPages' | 'publicBountyBoard'>;
}
