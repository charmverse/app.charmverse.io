import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await prisma.page.findFirst({
    where: {
      title: 'First proposal with credential'
    },
    select: {
      proposal: {
        select: {
          selectedCredentialTemplates: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
 
  console.log('Acc', acc)
}

search().then(() => console.log('Done'));
