import { processNftMints } from '../tasks/processNftMints';
import { prisma } from '@charmverse/core/prisma-client';

export async function query() {
  await processNftMints();
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
