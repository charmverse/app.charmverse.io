import { getUserNFTs} from 'lib/profile/getUserNFTs';
import { prisma } from 'db';
import { uniq } from 'lodash'

async function init () {
  const user = await prisma.profileItem.findMany({
    where: {
      type: 'nft'
    }
  })
  console.log(user.length)
  // const user2 = await prisma.user.findFirstOrThrow({
  //   where: {
  //     id: '04b4ccd8-a7f8-46d2-bbc0-6b5129b0aae2'
  //   }
  // })
  // const nfts = await getUserNFTs(user2.id);
  // console.log(nfts.map(nft => nft.id))
  // console.log(nfts.length)
  // console.log((uniq(nfts.map(nft => nft.id))).length)
  // console.log('user', user.id)
  // // const existing = await prisma.profileItem.findMany({
  // //   where: {
  // //     id: {
  // //       in: nfts.map(nft => nft.id)
  // //     }
  // //   }
  // // })
  // // console.log(existing)
}

init();