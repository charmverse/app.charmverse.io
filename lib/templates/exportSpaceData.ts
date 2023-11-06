import type { ProposalCategory, Role } from '@charmverse/core/prisma';

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
export async function exportSpaceData({ spaceId }: { spaceId: string }): Promise<SpaceDataExport> {
  const { permissions, roles } = await exportSpacePermissions({ spaceId });
  const { proposalCategories } = await exportSpaceProposalCategories({ spaceIdOrDomain: spaceId });
  const { pages } = await exportWorkspacePages({ sourceSpaceIdOrDomain: spaceId });

  return {
    pages,
    roles,
    permissions,
    proposalCategories
  };
}
