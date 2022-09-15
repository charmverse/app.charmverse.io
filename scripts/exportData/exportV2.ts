/* eslint-disable no-console */
import { exportWorkspacePages } from 'lib/templates/exportWorkspacePages';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';

// exportWorkspacePages({
//   exportName: 'gerals-station',
//   sourceSpaceIdOrDomain: 'zesty-salmon-takin'
// }).then((exported) => {
//   // eslint-disable-next-line no-console
//   console.log('Exported', exported.path);
// }).catch(err => {
//   console.warn(err);
// });

// importWorkspacePages({
//   exportName: 'space-tame-magenta-elephant-1663276172748',
//   targetSpaceIdOrDomain: 'ill-solana-urial'
// }).then((result) => {
//   console.log('Created ', result.pages, ' pages');
// });

// });

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
//   sourceSpaceIdOrDomain: 'gerals-station',
//   targetSpaceIdOrDomain: 'cvt-melboudi-admin-test'
// }).then(() => {

//   console.log('Job done');
// });

