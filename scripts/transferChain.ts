import { unsupportedChainIds } from 'lib/blockchain/constants';
import { prisma } from '../db';

(async () => {
  await prisma.bounty.updateMany({
    where: {
      chainId: {
        in: unsupportedChainIds
      }
    },
    // Transfer to goerli
    data: {
      chainId: 5
    }
  });

  await prisma.paymentMethod.deleteMany({
    where: {
      chainId: {
        in: unsupportedChainIds
      }
    }
  })
})();
