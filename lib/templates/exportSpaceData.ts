import type { Role } from '@charmverse/core/prisma';

import type { SpacePermissionsExport } from './exportSpacePermissions';
import { exportSpacePermissions } from './exportSpacePermissions';
import type { ExportedPage } from './exportWorkspacePages';
import { exportWorkspacePages } from './exportWorkspacePages';

export type SpaceDataExport = {
  pages?: ExportedPage[];
} & Partial<SpacePermissionsExport>;
export async function exportSpaceData({ spaceId }: { spaceId: string }): Promise<SpaceDataExport> {
  const spacePermissions = await exportSpacePermissions({ spaceId });
  const { pages } = await exportWorkspacePages({ sourceSpaceIdOrDomain: spaceId });

  return {
    pages,
    ...spacePermissions
  };
}
