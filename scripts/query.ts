import { prisma } from '@charmverse/core/prisma-client';

import { getSafeTxStatus } from 'lib/gnosis/getSafeTxStatus';
/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await getSafeTxStatus({
    chainId: 1,
    safeTxHash: '0xa73fccc71ff9f9224419e24d7354900095c9f4ab5284f1dcb0f5341ec09e83b2'
  });
  console.log(acc);
}

search().then(() => console.log('Done'));
