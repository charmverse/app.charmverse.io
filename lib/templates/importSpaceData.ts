import type { PageMeta } from '@charmverse/core/pages';

import { getSpace } from 'lib/spaces/getSpace';

import type { SpaceDataExport } from './exportSpaceData';
import { importPostCategories } from './importPostCategories';
import { importProposalCategories } from './importProposalCategories';
import { importRoles } from './importRoles';
import { importSpacePermissions } from './importSpacePermissions';
import { importWorkspacePages } from './importWorkspacePages';
import type { ImportParams } from './interfaces';

export type SpaceDataImportResult = Omit<SpaceDataExport, 'pages'> & {
  pages: PageMeta[];
  oldNewHashMaps: {
    roles: Record<string, string>;
    postCategories: Record<string, string>;
    proposalCategories: Record<string, string>;
    pages: Record<string, string>;
  };
};

export async function importSpaceData(importParams: ImportParams): Promise<SpaceDataImportResult> {
  const targetSpace = await getSpace(importParams.targetSpaceIdOrDomain);

  const { roles, oldNewRecordIdHashMap } = await importRoles(importParams);

  const { proposalCategories, oldNewIdMap: oldNewProposalCategoryIdMap } = await importProposalCategories(importParams);
  const { postCategories, oldNewIdMap: oldNewPostCategoryIdMap } = await importPostCategories(importParams);

  const { proposalCategoryPermissions, postCategoryPermissions, spacePermissions } = await importSpacePermissions(
    importParams
  );

  const { pages, oldNewRecordIdHashMap: oldNewPageIdMap } = await importWorkspacePages({
    ...importParams,
    updateTitle: false,
    resetPaths: true,
    includePermissions: false
  });

  return {
    pages,
    roles,
    permissions: {
      proposalCategoryPermissions,
      spacePermissions,
      postCategoryPermissions
    },
    postCategories,
    proposalCategories,
    oldNewHashMaps: {
      roles: oldNewRecordIdHashMap,
      proposalCategories: oldNewProposalCategoryIdMap,
      postCategories: oldNewPostCategoryIdMap,
      pages: oldNewPageIdMap
    }
  };
}
