import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

// {
//   id: 'dd047716-9512-447a-b9fd-79bfe8ccb280',
//   name: 'Greenpill Network'
// }

async function search() {
  const result = await prisma.project.deleteMany({
    where: {
      createdBy: 'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835'
    }
  });
  console.log(result);
}

search().then(() => console.log('Done'));
