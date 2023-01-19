import { prisma } from "db"
import { updateUsedIdentity } from "lib/users/updateUsedIdentity";
import { shortWalletAddress } from "lib/utilities/strings";

export async function setUserName() {

  const usersWithWalletId = await prisma.user.findMany({
    where: {
      identityType: 'Wallet',
      deletedAt: {
        not: null
      }
    },
    include: {
      wallets: true
    }
  });

  for (const user of usersWithWalletId) {

    if (user.wallets.length > 0) {
      await updateUsedIdentity(user.id, {
        displayName: user.wallets[0].ensname ?? shortWalletAddress(user.wallets[0].address),
        identityType: 'Wallet',
      })
    }
  }
}