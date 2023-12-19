import type { PageMeta } from '@charmverse/core/pages';

import { getSpace } from 'lib/spaces/getSpace';

import type { SpaceDataExport } from './exportSpaceData';
import { importForumPosts } from './importForumPosts';
import { importPostCategories } from './importPostCategories';
import { importProposalCategories } from './importProposalCategories';
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
    proposalCategories: Record<string, string>;
    pages: Record<string, string>;
    posts: Record<string, string>;
  };
};

export async function importSpaceData(importParams: ImportParams): Promise<SpaceDataImportResult> {
  const { roles, oldNewRecordIdHashMap: oldNewRoleIdHashMap } = await importRoles(importParams);

  const { proposalCategories, oldNewIdMap: oldNewProposalCategoryIdMap } = await importProposalCategories(importParams);
  const { postCategories, oldNewIdMap: oldNewPostCategoryIdMap } = await importPostCategories(importParams);

  const { proposalCategoryPermissions, postCategoryPermissions, spacePermissions } = await importSpacePermissions(
    importParams
  );

  const { pages, oldNewRecordIdHashMap: oldNewPageIdMap } = await importWorkspacePages({
    ...importParams,
    updateTitle: false,
    resetPaths: true,
    includePermissions: true,
    oldNewRoleIdHashMap,
    importingToDifferentSpace: true
  });

  const importedSpaceSettings = await importSpaceSettings(importParams);

  const { posts, postsIdHashmap } = await importForumPosts(importParams);

  return {
    pages,
    roles,
    posts,
    space: importedSpaceSettings,
    permissions: {
      proposalCategoryPermissions,
      spacePermissions,
      postCategoryPermissions
    },
    postCategories,
    proposalCategories,
    oldNewHashMaps: {
      roles: oldNewRoleIdHashMap,
      proposalCategories: oldNewProposalCategoryIdMap,
      postCategories: oldNewPostCategoryIdMap,
      pages: oldNewPageIdMap,
      posts: postsIdHashmap
    }
  };
}
