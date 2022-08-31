
import * as collab from 'lib/collabland';
import log from 'lib/log';
import { prisma } from '../db';

const userId = '9978671f-d976-4116-a824-edc117449f2d';

(async () => {

  const bounty = await prisma?.bounty.findFirstOrThrow({
    include: {
      page: true
    }
  });

  const user = await prisma?.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    include: {
      discordUser: true
    }
  });
  log.info('create vc for user', user);

  if (bounty.page && user.discordUser?.discordId) {
    const res = await collab.createBountyCreatedCredential({
      // @ts-ignore
      bounty,
      spaceDomain: 'local_test',
      discordUserId: user.discordUser.discordId
    });
    log.info('res', res);
  }

})();
