import { exportWorkspacePages } from 'lib/templates/exportWorkspacePages';

exportWorkspacePages({
  exportName: 'test',
  sourceSpaceIdOrDomain: 'occupational-utility-hamster'
}).then((exported) => {
  // eslint-disable-next-line no-console
  console.log('Exported', exported.path);
});
