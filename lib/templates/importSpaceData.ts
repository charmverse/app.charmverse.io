import { getSpace } from 'lib/spaces/getSpace';

import { getImportData } from './getImportData';
import { importSpacePermissions } from './importSpacePermissions';
import { importWorkspacePages } from './importWorkspacePages';
import type { ImportParams } from './interfaces';

export async function importSpaceData(importParams: ImportParams) {
  const targetSpace = await getSpace(importParams.targetSpaceIdOrDomain);

  const { oldNewRecordIdHashMap, pages } = await importWorkspacePages({
    ...importParams,
    resetPaths: true
  });

  const { proposalCategoryPermissions } = await importSpacePermissions(importParams);
}
