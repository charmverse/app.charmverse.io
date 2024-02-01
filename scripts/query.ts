import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const acc = await prisma.page.findMany({
    where: {
      type: 'bounty_template'
    },
    select: { createdAt: true, space: true, bounty: { include: { permissions: true } } }
  });

  console.log('Acc', acc.length);
  console.log('Acc', acc.filter((a) => !a.bounty?.permissions.some((p) => p.permissionLevel === 'reviewer')).length);
  console.log(
    'Acc',
    acc.filter((a) => !a.bounty?.permissions.some((p) => p.permissionLevel === 'reviewer')).map((a) => a.createdAt)
  );
}

search().then(() => console.log('Done'));
