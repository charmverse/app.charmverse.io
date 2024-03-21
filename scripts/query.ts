import { prisma } from '@charmverse/core/prisma-client';
import { uniq } from 'lodash';
/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await prisma.page.findFirst({
    where: {
      path: 'mufi-universal-music-distribution-protocol-8932847830027102'
    }
  });
  console.log(acc?.id);
}

search().then(() => console.log('Done'));
