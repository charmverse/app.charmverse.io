import { prisma } from '@charmverse/core/prisma-client';

export async function updateProToCommunity() {
  const result = await prisma.space.update({
    where: {
      paidTier: 'pro'
    },
    data: {
      paidTier: 'community'
    }
  });
  console.log('result', result);
}
updateProToCommunity();
