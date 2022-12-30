import {prisma} from 'db'
import { refreshENSName } from 'lib/blockchain/refreshENSName';



async function bulkRefreshEnsNames({skip = 0, concurrent = 10}: {skip?: number, concurrent?: number}) {
  const totalUserWallets =  await prisma.userWallet.count();

  for (let i = skip; i < totalUserWallets; i += concurrent) {
    const userWallets = await prisma.userWallet.findMany({
      skip: i,
      take: concurrent,
    });

    await Promise.all(userWallets.map(async (userWallet) => refreshENSName({userId: userWallet.userId, address: userWallet.address})));
  }

}