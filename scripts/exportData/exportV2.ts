/* eslint-disable no-console */
import { exportWorkspacePages } from 'lib/templates/exportWorkspacePages';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';


// exportWorkspacePages({
//   sourceSpaceIdOrDomain: 'deafening-apricot-crane',
//   exportName: 'test-stub'
// }).then(() => console.log('Complete'))


async function exportImport ({ sourceSpaceIdOrDomain, targetSpaceIdOrDomain }:
  {sourceSpaceIdOrDomain: string, targetSpaceIdOrDomain: string}): Promise<true> {
  const { data } = await exportWorkspacePages({
    sourceSpaceIdOrDomain
  });

  const result = await importWorkspacePages({
    targetSpaceIdOrDomain,
    exportData: data
  });

  console.log('Success ! Imported ', result.pages);

  return true;
}

// exportImport({
//   sourceSpaceIdOrDomain: 'imperial-floor-ostrich',
//   targetSpaceIdOrDomain: 'deafening-apricot-crane'
// }).then(() => {

//   console.log('Job done');
// });

