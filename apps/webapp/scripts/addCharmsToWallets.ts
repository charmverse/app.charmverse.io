import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { addCharms } from 'lib/charms/addCharms';
import { CharmActionTrigger } from 'lib/charms/constants';

const charms = [{ username: '0xe808…dafe', amount: 20 }];

export async function addCharmsToWallets() {
  for (const { amount, username } of charms) {
    try {
      const user = await prisma.user.findFirstOrThrow({ where: { username } });
      await addCharms({
        amount,
        recipient: { userId: user.id },
        actionTrigger: CharmActionTrigger.ETHDenver24ScavengerHunt
      });
      log.info(`Added ${amount} charms to ${username}`);
    } catch (e) {
      log.error(`Failed to add ${amount} charms to ${username}`, e);
    }
  }
}

addCharmsToWallets().then(() => {
  console.log('Done');
});
