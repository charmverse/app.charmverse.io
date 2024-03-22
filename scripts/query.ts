import { prisma } from '@charmverse/core/prisma-client';
import { uniq } from 'lodash';
/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await prisma.block.findFirst({
    where: {
      id: '69457d54-385d-49a4-9584-63e909002ff4'
    }
  });
  console.log(acc);
}

search().then(() => console.log('Done'));
