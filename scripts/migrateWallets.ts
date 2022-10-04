import { prisma } from 'db';

async function init () {

  //await prisma.userWallet.deleteMany();

  const users = await prisma.user.findMany({
    orderBy: {
      'createdAt': 'asc'
    },
    include: {
      spaceRoles: true
    }
  })

  const addressMap: { [address: string]: string } = {};

  return prisma.$transaction(async tx => {
    for (const user of users) {
      if (user.addresses.length && user.spaceRoles.length) {
        const uniqueAddresses = user.addresses.filter(a => {
          const used = !!addressMap[a];
          if (!used) {
            addressMap[a] = user.id;
            return true;
          }
          return false;
        });
        if (uniqueAddresses.length) {
          // await tx.userWallet.createMany({
          //   data: uniqueAddresses.map(address => ({ address, userId: user.id }))
          // });
        }
        else {
          console.log(`Workspace User ${user.id} has no unique addresses: ${user.addresses.join(', ')}`);
        }
      }
    }
  });

}

init().then(r => {
  console.log('done', r);
  process.exit();
}).catch(e => {
  console.error(e);
  process.exit(1);
})