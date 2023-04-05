import type { CharmversePrismaClient as Prisma } from '@charmverse/core';

export interface SpacePermissionConfigurationUpdate {
  spaceId: string;
  permissionConfigurationMode: Prisma.SpacePermissionConfigurationMode;
}
export type SpaceConfigurationPreset = Exclude<Prisma.SpacePermissionConfigurationMode, 'custom'>;

export interface SpacePermissionTemplate {
  spaceOperations: Record<Prisma.SpaceOperation, boolean>;
  pagePermissionDefaults: Pick<Prisma.Space, 'defaultPagePermissionGroup' | 'defaultPublicPages' | 'publicBountyBoard'>;
}
