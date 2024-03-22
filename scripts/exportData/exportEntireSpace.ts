import { exportSpaceData } from 'lib/templates/exportSpaceData';
import { importSpaceData } from 'lib/templates/importSpaceData';

exportSpaceData({ spaceIdOrDomain: 'cvt-template-gaming', filename: 'templateGaming.json' }).then(() =>
  console.log('Data exported!')
);

// importSpaceData({targetSpaceIdOrDomain: 'test-domain-imports', exportName: 'charmverse-demo.json'})
// .then(() => console.log('Data imported!'))
