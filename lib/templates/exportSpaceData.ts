import type { PostCategory, ProposalCategory, Role } from '@charmverse/core/prisma';

import { writeToSameFolder } from 'lib/utilities/file';

import type { ExportedPermissions, SpacePermissionsExport } from './exportSpacePermissions';
import { exportSpacePermissions } from './exportSpacePermissions';
import { exportSpacePostCategories } from './exportSpacePostCategories';
import { exportSpaceProposalCategories } from './exportSpaceProposalCategories';
import type { SpaceSettingsExport } from './exportSpaceSettings';
import type { ExportedPage } from './exportWorkspacePages';
import { exportWorkspacePages } from './exportWorkspacePages';

export type SpaceDataExport = {
  pages: ExportedPage[];
  postCategories: PostCategory[];
  proposalCategories: ProposalCategory[];
  roles: Role[];
  permissions: ExportedPermissions;
  space: SpaceSettingsExport;
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
  const { postCategories } = await exportSpacePostCategories({ spaceIdOrDomain });
  const { pages } = await exportWorkspacePages({ sourceSpaceIdOrDomain: spaceIdOrDomain });

  const exportedData: SpaceDataExport = {
    pages,
    roles,
    permissions,
    proposalCategories,
    postCategories
  };

  if (filename) {
    await writeToSameFolder({ data: JSON.stringify(exportedData, null, 2), fileName: `exports/${filename}` });
  }

  return exportedData;
}
