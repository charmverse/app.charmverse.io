
import * as collab from 'lib/collabland';
import log from 'lib/log';
import { prisma } from '../db';

const userId = '9978671f-d976-4116-a824-edc117449f2d';
// const discordId = '936350836110536735';
const aeToken = 'AQICAHhuh8o15jTBiKupSn4nNWgkQFmby0vKwGFSbeVzkjpvbQHcPmNUBrjt458i7CNkTJkCAAACYzCCAl8GCSqGSIb3DQEHBqCCAlAwggJMAgEAMIICRQYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAxuFeFQ3KtEvRYsMkgCARCAggIWpwf-Yt_t5v6X0uMAuUGW8SEPCXE3fUPjw8uWjoZvCHse3YRgVbopDiWFAbZHQquz4NQTxGVnLR4jsKZBV6ALv1cZYAJcgkqcKHUTV1EnTdY5ur3Tm1Tq1Bq_D6Oy0ahbFGBavUApeTDYQSkrXJqQ6ebOpV-K4wl0JDX_6nwVYsU-uqquuElbDVZJIlO89b5s_VBKfV8pETkhGFS4yBgG5qVSfiwGTbhhCEnBUNBpk1b7ob1ImpRoTFE0OoY7PrN8xbR8PCmzSPlyWH0ulnespDqFsqlrl3jYHYS6hcsycyxcz1T160Whdg_2a2_nwzQRZrQ2ux7rmtX6M03IT5kd54A7vLGpZglb6ibFvXrWtHsnrcOv0VelWBeECT0kQMAjR_RQK8EozJVwXVUuYbDixPHtaj7jWowEDPBuzv79sE79gN4Ny3fxS_Axqf29d2cBUqsPnZLrYMmTt5MdvQE_qw4EcYOJ-yzwK19tHJFYWSs9P5VdWTH2oPhFnrhFU-UgkzPoMxE32nB0pVoCla2GdoCMOHfC5fvNXjOKDNmuTUCpQysI4FGzEnryMIUMMHcym4ejDYsG_3ICA85JwyLj8238smYufhu7niSyiYlvxtjZLX3Q-NDF1pkdilQurKdzQc6JZt0j1WeEycRuIBPogVdFAunmux65GAnWx_r7tVa7yUiLry4Fp8xtLw6wP4_XGxxe7oNZ';

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

  const discordUserId = user.discordUser?.discordId;

  if (!discordUserId) {
    log.info('No discord user found for user');
    process.exit();
    return;
  }

  try {

    // get existing VC
    const vcs = await collab.getCredentials({ aeToken });
    log.info(vcs);

    // if (bounty.page) {
    //     log.info('create vc for user');
    //     const res = await collab.createBountyCreatedCredential({
    //       // @ts-ignore
    //       bounty,
    //       spaceDomain: 'local_test',
    //       discordUserId
    //     });
    //     log.info('res', JSON.stringify(res));
    //   }

    // const res = await fetch('https://api-qa.collab.land/veramo/vcs', {
    //   method: 'GET',
    //   headers: {
    //     Accept: 'application/json',
    //     'X-API-KEY': API_KEY,
    //     Authorization: `AE ${aeToken}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
  }
  catch (e) {
    log.error(e);
    process.exit(1);
  }

  process.exit(0);

})();
