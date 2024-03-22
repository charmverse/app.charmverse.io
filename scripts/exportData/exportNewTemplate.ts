import { prisma } from '@charmverse/core/prisma-client';
import { exportWorkspacePagesToDisk } from 'lib/templates/exportWorkspacePages';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';

exportWorkspacePagesToDisk({
  sourceSpaceIdOrDomain: 'cvt-template-gaming',
  exportName: 'templateGaming'
}).then(() => console.log('Export complete'));

// importWorkspacePages({
//   targetSpaceIdOrDomain: 'standard-crimson-gamefowl',
//   exportName: 'templateCustomDemo'
// }).then(() => console.log('Import complete'));

// prisma.page.deleteMany({
//   where: {
//     space: {
//       domain: 'example-space'
//     }
//   }
// }).then(() => console.log('Cleanup complete'))
