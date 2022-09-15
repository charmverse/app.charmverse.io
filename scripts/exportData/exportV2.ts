/* eslint-disable no-console */
import { exportWorkspacePages } from 'lib/templates/exportWorkspacePages';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';

// exportWorkspacePages({
//   exportName: 'test',
//   sourceSpaceIdOrDomain: 'occupational-utility-hamster'
// }).then((exported) => {
//   // eslint-disable-next-line no-console
//   console.log('Exported', exported.path);

importWorkspacePages({
  exportName: 'test',
  targetSpaceIdOrDomain: 'yabbering-amber-squid'
}).then((result) => {
  console.log('Created ', result.pages, ' pages');
});

// });

