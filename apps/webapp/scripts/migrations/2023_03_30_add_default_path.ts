import { prisma } from '@charmverse/core/prisma-client';
import { uid } from '@packages/utils/strings';

async function init() {
  // const users = await prisma.user.findMany({
  //   select: {
  //     id: true,
  //   },
  //   where: {
  //     path: null
  //   }
  // })
  // for (const user of users) {
  //   await prisma.user.update({
  //     where: {
  //       id: user.id
  //     },
  //     data: {
  //       path: uid()
  //     }
  //   })
  // }
}

init();
