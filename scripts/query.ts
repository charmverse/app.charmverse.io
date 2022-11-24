import { prisma } from 'db';

prisma.pageDiff.deleteMany({
  where: {
    pageId: '4bd13deb-57eb-4c1f-8939-1a0ce886f2a9'
  }
}).then(space => {
  // eslint-disable-next-line no-console
  console.log('Found space', space);
});
