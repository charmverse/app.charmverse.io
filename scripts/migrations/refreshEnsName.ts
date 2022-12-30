import {prisma} from 'db'
import { refreshENSName } from 'lib/blockchain/refreshENSName';



async function bulkRefreshEnsNames({skip = 0, concurrent = 10}: {skip?: number, concurrent?: number}) {
  const totalUserWallets =  await prisma.userWallet.count();

  for (let i = skip; i < totalUserWallets; i += concurrent) {
    console.log('Processing users', i, 'to', i + concurrent, 'of', totalUserWallets, '...')
    const userWallets = await prisma.userWallet.findMany({
      skip: i,
      take: concurrent,
    });

    let count = 0;

    await Promise.all(userWallets.map(async (userWallet) => {
      if (!userWallet.ensname) {
        count += 1;
        refreshENSName({userId: userWallet.userId, address: userWallet.address})
      }
    }));

    console.log('Refreshed', count, 'users')
  }

}