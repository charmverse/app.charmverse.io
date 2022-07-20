import { prisma } from 'db';

prisma.space.findFirst({
  where: {
    domain: 'cvt-onboarding'
  }
}).then(space => {
  // eslint-disable-next-line no-console
  console.log('Found space', space);
});
