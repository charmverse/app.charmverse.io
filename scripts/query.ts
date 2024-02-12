import { prisma } from '@charmverse/core/prisma-client';
import { uniq } from 'lodash';
/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await prisma.user.findMany({
    where: {
      xpsEngineId: {
        not: null
      }
    }
  });
}

search().then(() => console.log('Done'));
