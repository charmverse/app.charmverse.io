import type { ProposalCategory, Role } from '@charmverse/core/prisma';

import { writeToSameFolder } from 'lib/utilities/file';

import type { ExportedPermissions, SpacePermissionsExport } from './exportSpacePermissions';
import { exportSpacePermissions } from './exportSpacePermissions';
import { exportSpaceProposalCategories } from './exportSpaceProposalCategories';
import type { ExportedPage } from './exportWorkspacePages';
import { exportWorkspacePages } from './exportWorkspacePages';

export type SpaceDataExport = {
  pages: ExportedPage[];
  proposalCategories: ProposalCategory[];
  roles: Role[];
  permissions: ExportedPermissions;
};

/**
 * @filename
 */
type ExportParams = {
  spaceIdOrDomain: string;
  filename?: string;
};
export async function exportSpaceData({ spaceIdOrDomain, filename }: ExportParams): Promise<SpaceDataExport> {
  const { permissions, roles } = await exportSpacePermissions({ spaceIdOrDomain });
  const { proposalCategories } = await exportSpaceProposalCategories({ spaceIdOrDomain });
  const { pages } = await exportWorkspacePages({ sourceSpaceIdOrDomain: spaceIdOrDomain });

  const exportedData: SpaceDataExport = {
    pages,
    roles,
    permissions,
    proposalCategories
  };

  if (filename) {
    await writeToSameFolder({ data: JSON.stringify(exportedData, null, 2), fileName: `exports/${filename}` });
  }

  return exportedData;
}
