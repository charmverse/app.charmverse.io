import { getUserNFTs } from '@packages/profile/getUserNFTs';
import { prisma } from '@charmverse/core/prisma-client';
import { uniq } from 'lodash';

async function init() {
  const user = await prisma.profileItem.findMany({
    where: {
      type: 'nft'
    }
  });
  console.log('updating profile items:', user.length);

  for (let item of user) {
    if (!item.id.includes(item.userId)) {
      await prisma.profileItem.update({
        where: {
          id: item.id
        },
        data: {
          id: `${item.userId}:${item.id}`
        }
      });
    }
    if (user.indexOf(item) % 100 === 0) {
      console.log(user.indexOf(item));
    }
  }
  console.log('done');
}

init();
