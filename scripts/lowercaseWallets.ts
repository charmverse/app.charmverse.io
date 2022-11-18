import {prisma} from 'db'


export async function lowercaseWallets() {
  const walletCount = await prisma.userWallet.count();
  const wallets = await prisma.userWallet.findMany();

  console.log('All wallets found: ', walletCount === wallets.length);

  for (let i = 0; i < wallets.length; i++) {
    console.log('Processing wallet: ', i +1, ' / ', wallets.length);

    const targetWallet = wallets[i]

    await prisma.userWallet.update({
      where: {
        address: targetWallet.address
      },
      data: {
        address: targetWallet.address.toLowerCase()
      }
    })
  }

  return true
}