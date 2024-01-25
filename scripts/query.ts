import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

import { getDefaultPageForSpace } from 'lib/session/getDefaultPageForSpace';
async function search() {
  // const acc = await prisma.user.findUnique({
  //   where: {
  //     id: '4e1d4522-6437-4393-8ed1-9c56e53235f4'
  //   },
  //   include: {

  //   }
  // });

  // console.log('Acc', acc.length);
  // console.log('Acc', acc.filter((a) => !a.bounty?.permissions.some((p) => p.permissionLevel === 'reviewer')).length);
  // console.log(
  //   'Acc',
  //   acc.filter((a) => !a.bounty?.permissions.some((p) => p.permissionLevel === 'reviewer')).map((a) => a.createdAt)
  // );
  const r = await getDefaultPageForSpace({
    space: {
      id: 'bc9e8464-4166-4f7c-8a14-bb293cc30d2a',
      domain: 'charmverse',
      customDomain: 'work.charmverse.fyi'
    },
    userId: '4e1d4522-6437-4393-8ed1-9c56e53235f4'
  });
  console.log(r);
}

search().then(() => console.log('Done'));
