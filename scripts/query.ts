import { prisma } from '@charmverse/core/prisma-client';
import { uniq } from 'lodash';
/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await prisma.page.findUnique({
    where: {
      id: '0cbeaa44-7b44-4d80-8f86-139fd1f844e7'
    },
    include: {
      proposal: {
        include: {
          evaluations: {
            orderBy: {
              index: 'asc'
            }
          }
        }
      }
    }
  });
  console.log(acc);
}

search().then(() => console.log('Done'));
