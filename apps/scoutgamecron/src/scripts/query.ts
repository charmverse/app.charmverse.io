import { sendGemsPayoutEmails } from '../emails/sendGemsPayoutEmails/sendGemsPayoutEmails';
import { prisma } from '@charmverse/core/prisma-client';

export async function query() {
  await sendGemsPayoutEmails({
    week: '2024-W42'
  });
  // const builderNft = await prisma.builderNft.findMany({
  //   where: {
  //     tokenId: {
  //       in: [5]
  //     }
  //   },
  //   include: {
  //     builder: true
  //   }
  // });
  // console.log(builderNft);
}
query();
