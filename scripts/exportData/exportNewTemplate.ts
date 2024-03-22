import { exportSpaceData } from 'lib/templates/exportSpaceData';
import { importSpaceData } from 'lib/templates/importSpaceData';

// exportSpaceData({
//   sourceSpaceIdOrDomain: 'standard-crimson-gamefowl',
//   exportName: 'templateCustomDemo',
// }).then(() => console.log('Export complete'));

importSpaceData({
  targetSpaceIdOrDomain: 'example-space',
  exportName: 'templateCustomDemo'
}).then(() => console.log('Import complete'));
