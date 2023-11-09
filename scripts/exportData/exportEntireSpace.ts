import {exportSpaceData} from 'lib/templates/exportSpaceData';
import { importSpaceData } from 'lib/templates/importSpaceData';


// exportSpaceData({spaceIdOrDomain: 'charmverse-demo', filename: 'charmverse-demo.json'})
// .then(() => console.log('Completed!'))

importSpaceData({targetSpaceIdOrDomain: 'test-domain-imports', exportName: 'charmverse-demo.json'})
.then(() => console.log('Completed!'))