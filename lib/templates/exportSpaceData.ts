import { exportSpacePermissions, type SpacePermissionsExport } from './exportSpacePermissions';
import { exportWorkspacePages, type ExportedPage, type WorkspacePagesExport } from './exportWorkspacePages';

export type SpaceDataExport = {
  permissions: SpacePermissionsExport;
  pages: ExportedPage[];
};
export async function exportSpaceData({ spaceId }: { spaceId: string }): Promise<SpaceDataExport> {
  const spacePermissions = await exportSpacePermissions({ spaceId });
  const { pages } = await exportWorkspacePages({ sourceSpaceIdOrDomain: spaceId });

  return {
    pages,
    permissions: spacePermissions
  };
}
