import { prisma } from '@charmverse/core/prisma-client';
import { exportWorkspacePagesToDisk } from 'lib/templates/exportWorkspacePages';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';

// exportWorkspacePagesToDisk({
//   sourceSpaceIdOrDomain: 'standard-crimson-gamefowl',
//   exportName: 'templateCustomDemo',
// }).then(() => console.log('Export complete'));


importWorkspacePages({
  targetSpaceIdOrDomain: 'example-space',
  exportName: 'templateCustomDemo',
}).then(() => console.log('Import complete'))


// prisma.page.deleteMany({
//   where: {
//     space: {
//       domain: 'example-space'
//     }
//   }
// }).then(() => console.log('Cleanup complete'))