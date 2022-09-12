import log from 'lib/log';
import { prisma } from '../db';

(async () => {
  const poaps = await prisma.poap.findMany({});
  try {
    await Promise.all(poaps.map(poap => prisma.profileItem.createMany({
      data: {
        id: poap.tokenId,
        type: 'poap',
        userId: poap.userId,
        isHidden: poap.isHidden,
        metadata: {
          walletAddress: poap.walletAddress
        }
      }
    })));
  }
  catch (err) {
    log.error('error creating profile items', err);
  }
})();
