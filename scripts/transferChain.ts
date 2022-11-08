import { prisma } from '../db';

(async () => {
  await prisma.bounty.updateMany({
    where: {
      chainId: 4
    },
    // Transfer to goerli
    data: {
      chainId: 5
    }
  });

  await prisma.paymentMethod.deleteMany({
    where: {
      chainId: 4
    }
  })

  await prisma.userGnosisSafe.deleteMany({
    where: {
      chainId: 4
    }
  })
})();
