import { convertJsonPagesToPrisma } from 'lib/pages/server/convertJsonPagesToPrisma';

const folderPath = '/home/mo/Development/app.charmverse.io/scripts/exportData/exports/space-af7b2d25-ee15-41a0-b020-2ffeb2631829-pages-1657834753541';

const targetSpaceId = 'f37536ff-2f22-44ce-8499-06fbf8a97478';

convertJsonPagesToPrisma({ spaceId: targetSpaceId, folderPath })
  .then((toCreate) => {

    //    console.log('Transaction inputs', toCreate);
  });

