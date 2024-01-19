import { prisma } from '@charmverse/core/prisma-client';
import { staticSpaceTemplates } from 'lib/spaces/config';
import { exportSpaceData } from 'lib/templates/exportSpaceData';
import { writeToSameFolder } from 'lib/utilities/file';
import { prettyPrint } from 'lib/utilities/strings';

async function refreshSpaceTemplates(selectedTemplates?: Array<(typeof staticSpaceTemplates)[number]['id']>) {
  for (const template of staticSpaceTemplates) {
    if (!selectedTemplates || selectedTemplates.includes(template.id)) {
      await exportSpaceData({ spaceIdOrDomain: template.spaceId, filename: `${template.id}.json` });
      console.log('Template updated: ', template.name);
    }
  }
}

// function

refreshSpaceTemplates().then(() => console.log('Done'));

// prisma.page
//   .findFirstOrThrow({
//     where: {
//       path: 'getting-started-3818695842119486',
//       space: {
//         domain: 'cvt-nft-community-template'
//       }
//     }
//   })
//   .then(
//     async (page) =>
//       await writeToSameFolder({ data: prettyPrint(page), fileName: 'getting-started-3818695842119486.json' })
//   );
