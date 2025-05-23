import type { Post, PostCategory, Role } from '@charmverse/core/prisma';
import { writeToSameFolder } from '@packages/lib/utils/file';
import type { ExportedPage } from '@packages/spaces/export/exportWorkspacePages';
import { exportWorkspacePages } from '@packages/spaces/export/exportWorkspacePages';

import { exportForumPosts } from './exportForumPosts';
import type { ExportedPermissions } from './exportSpacePermissions';
import { exportSpacePermissions } from './exportSpacePermissions';
import { exportSpacePostCategories } from './exportSpacePostCategories';
import { exportSpaceSettings, type SpaceSettingsExport } from './exportSpaceSettings';

export type SpaceDataExport = {
  pages: ExportedPage[];
  postCategories: PostCategory[];
  posts: Post[];
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
  const { postCategories } = await exportSpacePostCategories({ spaceIdOrDomain });
  const { pages } = await exportWorkspacePages({ sourceSpaceIdOrDomain: spaceIdOrDomain });
  const { space } = await exportSpaceSettings({ spaceIdOrDomain });
  const { posts } = await exportForumPosts({ spaceIdOrDomain });

  const exportedData: SpaceDataExport = {
    pages,
    roles,
    permissions,
    postCategories,
    posts,
    space
  };

  if (filename) {
    await writeToSameFolder({ data: JSON.stringify(exportedData, null, 2), fileName: `exports/${filename}` });
  }

  return exportedData;
}
