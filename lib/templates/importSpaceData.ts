import { getSpace } from 'lib/spaces/getSpace';

import type { SpaceDataExport } from './exportSpaceData';
import { getImportData } from './getImportData';
import { importProposalCategories } from './importProposalCategories';
import { importRoles } from './importRoles';
import { importSpacePermissions } from './importSpacePermissions';
import { importWorkspacePages } from './importWorkspacePages';
import type { ImportParams } from './interfaces';

export type SpaceDataImportResult = SpaceDataExport;

export async function importSpaceData(importParams: ImportParams): Promise<SpaceDataImportResult> {
  const targetSpace = await getSpace(importParams.targetSpaceIdOrDomain);

  const { oldNewRecordIdHashMap, pages } = await importWorkspacePages({
    ...importParams,
    resetPaths: true
  });

  const { roles } = await importRoles(importParams);

  const { proposalCategories } = await importProposalCategories(importParams);

  const { proposalCategoryPermissions, roles } = await importSpacePermissions(importParams);

  return {
    pages,
    roles,
    permissions: {
      proposalCategoryPermissions,
      spacePermissions
    }
  };
}
