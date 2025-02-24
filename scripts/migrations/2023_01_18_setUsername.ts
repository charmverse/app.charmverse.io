import { prisma } from '@charmverse/core/prisma-client';
import { updateUsedIdentity } from '@packages/users/updateUsedIdentity';
import { shortWalletAddress } from '@packages/utils/blockchain';

export async function setUserName() {
  const usersWithWalletId = await prisma.user.findMany({
    where: {
      identityType: 'Wallet',
      deletedAt: null
    },
    include: {
      wallets: true
    }
  });
  const addressUsernames = usersWithWalletId.filter((u) => u.username.startsWith('0x'));
  console.log('users to check', addressUsernames.length);
  let i = 0;
  for (const user of usersWithWalletId) {
    if (i++ % 100 === 0) {
      console.log(i);
    }
    if (user.wallets.length > 0) {
      await updateUsedIdentity(user.id, {
        displayName: user.wallets[0].ensname ?? shortWalletAddress(user.wallets[0].address),
        identityType: 'Wallet'
      });
    }
  }
}
setUserName();
