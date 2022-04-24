import { prisma } from 'db';

async function main () {
  await prisma.page.updateMany({
    where: {
      deletedAt: {
        not: null
      }
    },
    data: {
      deletedAt: null
    }
  });

  await prisma.block.updateMany({
    where: {
      deletedAt: {
        not: null
      }
    },
    data: {
      deletedAt: null
    }
  });
}

main();
