import type { PageMeta } from '@packages/core/pages';

import type { SpaceDataExport } from './exportSpaceData';
import { importForumPosts } from './importForumPosts';
import { importPostCategories } from './importPostCategories';
import { importRoles } from './importRoles';
import { importSpacePermissions } from './importSpacePermissions';
import { importSpaceSettings } from './importSpaceSettings';
import { importWorkspacePages } from './importWorkspacePages';
import type { ImportParams } from './interfaces';

export type SpaceDataImportResult = Omit<SpaceDataExport, 'pages'> & {
  pages: PageMeta[];
  oldNewHashMaps: {
    roles: Record<string, string>;
    postCategories: Record<string, string>;
    pages: Record<string, string>;
    posts: Record<string, string>;
  };
};

export async function importSpaceData(importParams: ImportParams): Promise<SpaceDataImportResult> {
  const { roles, oldNewRecordIdHashMap: oldNewRoleIdHashMap } = await importRoles(importParams);

  const { postCategories, oldNewIdMap: oldNewPostCategoryIdMap } = await importPostCategories(importParams);

  const { postCategoryPermissions, spacePermissions } = await importSpacePermissions(importParams);

  // This should be imported before pages because it provides the proposal workflow ids
  const importedSpaceSettings = await importSpaceSettings({ ...importParams, oldNewRoleIdHashMap });

  const { pages, oldNewRecordIdHashMap: oldNewPageIdMap } = await importWorkspacePages({
    ...importParams,
    updateTitle: false,
    resetPaths: true,
    includePermissions: true,
    oldNewRoleIdHashMap,
    importingToDifferentSpace: true,
    oldNewProposalWorkflowIdHashMap: importedSpaceSettings.oldNewProposalWorkflowIds
  });

  const { posts, postsIdHashmap } = await importForumPosts(importParams);

  return {
    pages,
    roles,
    posts,
    space: importedSpaceSettings,
    permissions: {
      spacePermissions,
      postCategoryPermissions
    },
    postCategories,
    oldNewHashMaps: {
      roles: oldNewRoleIdHashMap,
      postCategories: oldNewPostCategoryIdMap,
      pages: oldNewPageIdMap,
      posts: postsIdHashmap
    }
  };
}
